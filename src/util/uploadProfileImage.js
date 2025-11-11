
const CLOUDINARY_UPLOAD_PRESET = "Spendwise";
const CLOUDINARY_CLOUD_NAME = "dwdiu3487";

export const API_ENDPOINTS = {
  UPLOAD_IMAGE: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  // ...other endpoints
};

export const uploadProfileImage = async (image) => {
  const formData = new FormData();
  formData.append("file", image);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  // Optional: organize uploads
  // formData.append("folder", "spendwise/avatars");

  const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData?.error?.message || message;
    } catch {}
    throw new Error(`Cloudinary upload failed: ${message}`);
  }

  const data = await response.json();
  // data.secure_url is the final HTTPS URL
  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
};
