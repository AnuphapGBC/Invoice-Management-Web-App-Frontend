import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InvoiceFormPopup.css';

const InvoiceFormPopup = ({ invoice, onSave, onClose, receiptTypes }) => {
  const [formInvoice, setFormInvoice] = useState(
    invoice || {
      invoiceNumber: '',
      receiptNumber: '',
      date: '',
      time: '',
      receiptType: '',
      narrative: '',
      amount: '',
      currency: '',
      images: [],
      existingImages: [],
    }
  );

  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);

  useEffect(() => {
    const fetchInvoiceImages = async () => {
      if (invoice) {
        try {
          const response = await axios.get(`http://localhost:5001/api/invoices/${invoice.id}/images`);
          if (response.data && response.data.images) {
            setFormInvoice((prev) => ({
              ...prev,
              existingImages: response.data.images,
              time: invoice.time ? invoice.time.substring(0, 5) : '', // Set time to `HH:MM` format for editing
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch images for invoice ${invoice.id}`, error);
        }
      }
    };

    fetchInvoiceImages();
  }, [invoice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle time format properly
    if (name === 'time') {
      // Convert `HH:MM` from input to `HH:MM:00` format for storage
      setFormInvoice({ ...formInvoice, [name]: `${value}:00` });
    } else {
      setFormInvoice({ ...formInvoice, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormInvoice({ ...formInvoice, images: files });
  };

  const handleRemoveExistingImage = (imageUrl) => {
    // Show confirmation for image deletion
    setImageToDelete(imageUrl);
  };

  const handleConfirmDeleteImage = async () => {
    if (imageToDelete) {
      try {
        // Make request to delete image from database and uploads folder
        await axios.delete(`http://localhost:5001/api/invoices/images`, {
          data: { imageUrl: imageToDelete },
        });
        // Remove image from existing images in state
        setFormInvoice({
          ...formInvoice,
          existingImages: formInvoice.existingImages.filter((img) => img.imageUrl !== imageToDelete),
        });
        // Reset image to delete
        setImageToDelete(null);
      } catch (error) {
        console.error('Failed to delete image', error);
      }
    }
  };

  const handleCancelDeleteImage = () => {
    setImageToDelete(null);
  };

  const handleImageClick = (imageUrl) => {
    setFullScreenImage(imageUrl);
  };

  const handleCloseFullScreen = (e) => {
    e.stopPropagation(); // Prevent any other click events when closing
    setFullScreenImage(null);
  };

  const handleSubmit = () => {
    onSave(formInvoice);
    alert(invoice ? 'Invoice updated successfully!' : 'Invoice added successfully!');
    // Refresh the page after the alert
    window.location.reload();
  };

  return (
    <div className="popup-overlay fancy-popup">
      <div className="popup fancy-popup-window">
        <h3>{invoice ? 'Edit Invoice' : 'Add Invoice'}</h3>
        <input
          type="text"
          name="invoiceNumber"
          placeholder="Invoice Number"
          value={formInvoice.invoiceNumber}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="receiptNumber"
          placeholder="Receipt Number"
          value={formInvoice.receiptNumber}
          onChange={handleInputChange}
        />
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={formInvoice.date}
          onChange={handleInputChange}
        />
        <input
          type="time"
          name="time"
          placeholder="Time"
          value={formInvoice.time.substring(0, 5)} // Set time in `HH:MM` format for input
          onChange={handleInputChange}
        />
        <select
          name="receiptType"
          value={formInvoice.receiptType}
          onChange={handleInputChange}
        >
          <option value="">Select Receipt Type</option>
          {receiptTypes.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
        <textarea
          name="narrative"
          placeholder="Narrative"
          value={formInvoice.narrative}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formInvoice.amount}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="currency"
          placeholder="Currency"
          value={formInvoice.currency}
          onChange={handleInputChange}
        />

        {/* Show Existing Images */}
        {Array.isArray(formInvoice.existingImages) && formInvoice.existingImages.length > 0 && (
          <div className="existing-images">
            <h4>Existing Images</h4>
            <div className="existing-images-list">
              {formInvoice.existingImages.map((image, index) => (
                <div key={index} className="existing-image-item">
                  <img
                    src={`http://localhost:5001/${image.imageUrl}`}
                    alt={`Invoice ${formInvoice.invoiceNumber} Image ${index + 1}`}
                    className="invoice-image-thumbnail"
                    onClick={() => handleImageClick(image.imageUrl)}
                  />
                  {/* <button
                    type="button"
                    className="remove-image-button fancy-button"
                    onClick={() => handleRemoveExistingImage(image.imageUrl)}
                  >
                    Remove
                  </button> */}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <input
          type="file"
          name="images"
          multiple
          onChange={handleImageChange}
          accept="image/*"
        />

        <div className="popup-buttons">
          <button onClick={handleSubmit} className="fancy-button">
            {invoice ? 'Update Invoice' : 'Add Invoice'}
          </button>
          <button onClick={onClose} className="fancy-button cancel-button">
            Cancel
          </button>
        </div>
      </div>

      {/* Full Screen Image View */}
      {fullScreenImage && (
        <div className="full-screen-overlay" onClick={handleCloseFullScreen}>
          <div className="full-screen-image-container">
            <img
              src={`http://localhost:5001/${fullScreenImage}`}
              alt="Full Screen"
              className="full-screen-image"
            />
            <button
              type="button"
              className="close-full-screen-button fancy-button"
              onClick={handleCloseFullScreen}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Image Deletion */}
      {/* {imageToDelete && (
        <div className="confirmation-overlay">
          <div className="confirmation-box">
            <p>Are you sure you want to delete this image?</p>
            <div className="confirmation-buttons">
              <button
                type="button"
                className="fancy-button confirm-button"
                onClick={handleConfirmDeleteImage}
              >
                Yes
              </button>
              <button
                type="button"
                className="fancy-button cancel-button"
                onClick={handleCancelDeleteImage}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default InvoiceFormPopup;
