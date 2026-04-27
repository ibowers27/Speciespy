/**
 * Service for handling species identification logic, including:
 * - Uploading images to Firebase Storage
 * - API Pipeline: Calling PlantNet and Animal Detect APIs for identification
 * - Saving post data to Firestore
 */
import { storage, db, auth } from "../firebase/fbconfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY;
const ANIMALDETECT_API_KEY = process.env.EXPO_PUBLIC_ANIMALDETECT_API_KEY;

type Prediction = {
  scientificName: string;
  commonName: string;
  confidence: number;
};

// Create a new post with image and identification
export const createPost = async (
  imageUri: string,
  latitude?: number | null,
  longitude?: number | null
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be signed in");

  try {
    // Upload image to Firebase Storage
    console.log("Fetching image...");
    const response = await fetch(imageUri);
    const blob = await response.blob();
    console.log("Blob size:", blob.size, "type:", blob.type);

    console.log("Uploading to Firebase...");
    const filename = `species-photos/${user.uid}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    const imageUrl = await getDownloadURL(storageRef);
    console.log("Image uploaded:", imageUrl);

    // Default values in case identification fails
    let scientificName: string = "Unknown Species";
    let commonName: string = "To be identified";
    let confidence: number = 0;
    let topPredictions: Prediction[] = [];
    let identificationSource: string = "none";

    // Try Pl@ntNet first (for plants)
    try {
      console.log("Trying Pl@ntNet...");
      const formData = new FormData();
      
      // React Native FormData requires specific format
      formData.append('images', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('organs', 'auto');

      // PlantNet API call, region specified for better accuracy
      const plantnetResponse = await fetch(
        `https://my-api.plantnet.org/v2/identify/k-southeastern-u-s-a?api-key=${PLANTNET_API_KEY}`,
        { 
          method: 'POST', 
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log("Pl@ntNet status:", plantnetResponse.status);

      if (plantnetResponse.ok) {
        const plantnetData = await plantnetResponse.json();
        console.log("Pl@ntNet results count:", plantnetData.results?.length || 0);

        if (plantnetData.results && plantnetData.results.length > 0) {
          const topResult = plantnetData.results[0];
          
          scientificName = topResult.species?.scientificNameWithoutAuthor || "Unknown";
          
          const commonNames = topResult.species?.commonNames;
          if (commonNames && commonNames.length > 0) {
            commonName = commonNames[0];
          } else {
            commonName = scientificName;
          }
          
          confidence = topResult.score || 0;

          topPredictions = plantnetData.results.slice(0, 5).map((r: any) => {
            const names = r.species?.commonNames;
            return {
              scientificName: r.species?.scientificNameWithoutAuthor || "Unknown",
              commonName: (names && names.length > 0) ? names[0] : r.species?.scientificNameWithoutAuthor || "Unknown",
              confidence: r.score || 0
            };
          });

          identificationSource = "Pl@ntNet";
          console.log("✅ Pl@ntNet:", commonName, `(${(confidence * 100).toFixed(1)}%)`);
          console.log("Remaining requests today:", plantnetData.remainingIdentificationRequests);
        } else {
          console.log("⚠️ No plant match, trying Animal Detect...");
        }
      } else {
        const errorText = await plantnetResponse.text();
        console.warn("⚠️ Pl@ntNet failed:", plantnetResponse.status, errorText);
      }
    } catch (plantnetError: any) {
      console.log("⚠️ Pl@ntNet error:", plantnetError.message);
    }

    // If Pl@ntNet didn't work, try Animal Detect
    if (confidence === 0) {
      try {
        console.log("Using Animal Detect...");

        // Compress image before sending to Animal Detect following their recommendation for mobile uploads
        const compressedUri = await compressImage(imageUri);
        
        const formData = new FormData();
        
        // React Native FormData format
        formData.append('image', {
          uri: compressedUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
        formData.append('country', 'USA');
        formData.append('threshold', '0.2');

        const animalResponse = await fetch(
          "https://www.animaldetect.com/api/v1/detect",
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${ANIMALDETECT_API_KEY}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData
          }
        );

        console.log("Animal Detect status:", animalResponse.status);

        if (animalResponse.ok) {
          const data = await animalResponse.json();
          console.log("Animal Detect annotations:", data.annotations?.length || 0);

          if (data.annotations && data.annotations.length > 0) {
            const annotation = data.annotations[0];
            
            // Animal Detect taxonomy can be less detailed, so check species, then genus, then family for availablility
            const taxonomy = annotation.taxonomy || {};
            if (taxonomy.species) {
              scientificName = taxonomy.species;
            } else if (taxonomy.genus) {
              scientificName = taxonomy.genus;
            } else if (taxonomy.family) {
              scientificName = taxonomy.family;
            } else {
              scientificName = "Animal";
            }
            
            commonName = annotation.label || "Animal";
            confidence = annotation.score || 0;

            topPredictions = data.annotations.slice(0, 5).map((a: any) => {
              const tax = a.taxonomy || {};
              const sciName = tax.species || tax.genus || tax.family || "Unknown";
              return {
                scientificName: sciName,
                commonName: a.label || "Unknown",
                confidence: a.score || 0
              };
            });

            identificationSource = "Animal Detect";
            console.log("✅ Animal Detect:", commonName, `(${(confidence * 100).toFixed(1)}%)`);
          } else {
            console.log("⚠️ No animals detected");
          }
        } else {
          const errorText = await animalResponse.text();
          console.warn("⚠️ Animal Detect failed:", animalResponse.status, errorText);
        }
      } catch (e: any) {
        console.error("⚠️ Animal Detect error:", e.message);
      }
    }

    // Save post data to Firestore
    console.log("Saving to Firestore...");
    const postData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
      imageUrl,
      scientificName,
      commonName,
      confidence,
      topPredictions,
      identificationSource,
      latitude: latitude || null,
      longitude: longitude || null,
      timestamp: serverTimestamp(),
      likes: 0,
      commentCount: 0,
    };

    const docRef = await addDoc(collection(db, "posts"), postData);
    console.log("✅ Post saved! ID:", docRef.id);

    return {
      postId: docRef.id,
      imageUrl,
      scientificName,
      commonName,
      confidence,
      topPredictions,
    };

  } catch (error: any) {
    console.error("❌ Full error:", error);
    throw error;
  }
};

// Method to compress image for Animal Detect API following their recommendation for mobile uploads
const compressImage = async (uri: string, maxSizeBytes: number = 1000000): Promise<string> => {
  let quality = 0.7;
  let result = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    compress: quality,
    format: SaveFormat.JPEG,
  });

  // If still too large, compress more
  while (quality > 0.2) {
    const response = await fetch(result.uri);
    const blob = await response.blob();
    if (blob.size <= maxSizeBytes) break;
    
    quality -= 0.1;
    result = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
      compress: quality,
      format: SaveFormat.JPEG,
    });
  }

  return result.uri;
};