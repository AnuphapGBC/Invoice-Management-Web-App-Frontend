import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InvoiceFormPopup.css';

const InvoiceFormPopup = ({ invoice, onSave, onClose }) => {
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
      targetCurrency: '', // Added field for target currency
      conversionRate: 1, // Added field for conversion rate
      convertedAmount: '', // Added field for converted amount
    }
  );

  const [receiptTypes, setReceiptTypes] = useState([]);
  const [isLoadingReceiptTypes, setIsLoadingReceiptTypes] = useState(true);

  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);

  // List of all available currencies
  const availableCurrencies = [
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'SEK', 
    'NOK', 'DKK', 'ZAR', 'SGD', 'HKD', 'NZD', 'KRW', 'TRY', 'RUB', 'AED', 'PHP', 'THB',
    // Add more currencies if needed
  ];

  useEffect(() => {
    // Fetch receipt types
    const fetchReceiptTypes = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/receipt-types`);
        if (response.data) {
          setReceiptTypes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch receipt types:', error);
      } finally {
        setIsLoadingReceiptTypes(false);
      }
    };

    fetchReceiptTypes();
  }, []); // Only run once on component mount


  useEffect(() => {
    // Fetch invoice images
    const fetchInvoiceImages = async () => {
      if (invoice) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${invoice.id}/images`);
          if (response.data && response.data.images) {
            setFormInvoice((prev) => ({
              ...prev,
              existingImages: response.data.images,
              time: invoice.time ? invoice.time.substring(0, 5) : '',
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch images for invoice ${invoice.id}`, error);
        }
      }
    };

    fetchInvoiceImages();
  }, [invoice]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle time format properly
    if (name === 'time') {
      // Convert `HH:MM` from input to `HH:MM:00` format for storage
      setFormInvoice({ ...formInvoice, [name]: `${value}:00` });
    } else {
      setFormInvoice({ ...formInvoice, [name]: value });

      // Update converted amount if relevant fields are changed
      if (name === 'amount' || name === 'conversionRate' || name === 'targetCurrency') {
        updateConvertedAmount({ ...formInvoice, [name]: value });
      }
    }
  };

  // Update converted amount whenever amount, conversion rate, or target currency changes
  const updateConvertedAmount = (updatedInvoice) => {
    const { amount, conversionRate, targetCurrency } = updatedInvoice;
    if (amount && conversionRate && targetCurrency) {
      const convertedAmount = (amount * conversionRate).toFixed(2);
      setFormInvoice((prev) => ({ ...prev, convertedAmount }));
    } else {
      setFormInvoice((prev) => ({ ...prev, convertedAmount: '' }));
    }
  };

  // Handle the change in images
  // const handleImageChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   setFormInvoice({ ...formInvoice, images: files });
  // };
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
  
    // Optional: Show a temporary "loading" indicator
    setFormInvoice((prev) => ({ ...prev, images: files }));
  };
  

  // Handle removing an existing image
  const handleRemoveExistingImage = (imageUrl) => {
    setImageToDelete(imageUrl);
  };

  // Confirm delete of existing image
  const handleConfirmDeleteImage = async () => {
    if (imageToDelete) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/images`, {
          data: { imageUrl: imageToDelete },
        });
        setFormInvoice({
          ...formInvoice,
          existingImages: formInvoice.existingImages.filter((img) => img.imageUrl !== imageToDelete),
        });
        setImageToDelete(null);
      } catch (error) {
        console.error('Failed to delete image', error);
      }
    }
  };

  // Cancel delete image
  const handleCancelDeleteImage = () => {
    setImageToDelete(null);
  };

  // Handle displaying an image in fullscreen
  const handleImageClick = (imageUrl) => {
    setFullScreenImage(imageUrl);
  };

  // Close fullscreen image view
  const handleCloseFullScreen = (e) => {
    e.stopPropagation(); // Prevent any other click events when closing
    setFullScreenImage(null);
  };

  // Handle form submission
  // const handleSubmit = () => {
  //   onSave(formInvoice);
  //   alert(invoice ? 'Invoice updated successfully!' : 'Invoice added successfully!');
  //   // Refresh the page after the alert
  //   window.location.reload();
  // };
  const handleSubmit = () => {
    if (formInvoice.images.length === 0 && formInvoice.existingImages.length === 0) {
      alert('Please upload at least one image before submitting.');
      return;
    }
  
    console.log("Submitting with images:", formInvoice.images.map(f => f.name));
  
    onSave(formInvoice);
    alert(invoice ? 'Invoice updated successfully!' : 'Invoice added successfully!');
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
          disabled={isLoadingReceiptTypes}
        >
          <option value="">{isLoadingReceiptTypes ? 'Loading...' : 'Select Receipt Type'}</option>
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

        {/* Dropdown for selecting currency */}
        <select
          name="currency"
          value={formInvoice.currency}
          onChange={handleInputChange}
        >
          <option value="">Select Currency</option>
          {availableCurrencies.map((currency, index) => (
            <option key={index} value={currency}>
              {currency}
            </option>
          ))}
        </select>

        {/* Converting Currency Section */}
        <select
          name="targetCurrency"
          value={formInvoice.targetCurrency}
          onChange={handleInputChange}
        >
          <option value="">Select Target Currency</option>
          {availableCurrencies.map((currency, index) => (
            <option key={index} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="conversionRate"
          placeholder="Conversion Rate"
          value={formInvoice.conversionRate}
          onChange={(e) => {
            handleInputChange(e);
            updateConvertedAmount({ ...formInvoice, conversionRate: e.target.value });
          }}
        />
        <input
          type="text"
          name="convertedAmount"
          placeholder="Converted Amount"
          value={formInvoice.convertedAmount}
          readOnly
        />

        {/* Show Existing Images */}
        {Array.isArray(formInvoice.existingImages) && formInvoice.existingImages.length > 0 && (
          <div className="existing-images">
            <h4>Existing Images</h4>
            <div className="existing-images-list">
              {formInvoice.existingImages.map((image, index) => (
                <div key={index} className="existing-image-item">
                  <img
                    src={`${process.env.REACT_APP_IMAGE_BASE_URL}/${image.imageUrl.split('/').pop()}`}
                    alt={`Invoice ${formInvoice.invoiceNumber} Image ${index + 1}`}
                    className="invoice-image-thumbnail"
                    onClick={() => handleImageClick(image.imageUrl)}
                  />
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
              src={`${process.env.REACT_APP_IMAGE_BASE_URL}/${fullScreenImage.split('/').pop()}`}
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
    </div>
  );
};

export default InvoiceFormPopup;