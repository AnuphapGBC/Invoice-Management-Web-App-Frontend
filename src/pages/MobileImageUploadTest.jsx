import React, { useState } from 'react';
import axios from 'axios';

const MobileImageUploadTest = () => {
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📷 Selected:", file.name, file.type, file.size);
    setImageFile(file);
  };

  const handleUpload = async () => {
    if (!imageFile) {
      alert("Please take or choose a photo first.");
      return;
    }

    const formData = new FormData();
    formData.append("images", imageFile); // same key as your backend expects

    console.log("📦 Uploading image:", imageFile.name);
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/invoices/test-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Upload success:", response.data);
      alert("Image uploaded successfully!");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Upload failed.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📸 Mobile Image Upload Test</h2>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
      />
      <br />
      <button onClick={handleUpload} style={{ marginTop: "1rem" }}>
        Upload Image
      </button>
    </div>
  );
};

export default MobileImageUploadTest;
