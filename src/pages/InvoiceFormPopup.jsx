import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InvoiceFormPopup.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const defaultForm = {
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
  targetCurrency: '',
  conversionRate: 1,
  convertedAmount: '',
};

const availableCurrencies = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL',
  'MXN', 'SEK', 'NOK', 'DKK', 'ZAR', 'SGD', 'HKD', 'NZD', 'KRW',
  'TRY', 'RUB', 'AED', 'PHP', 'THB'
];

const InvoiceFormPopup = ({ invoice, onSave, onClose }) => {
  const [formInvoice, setFormInvoice] = useState(invoice || defaultForm);
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [isLoadingReceiptTypes, setIsLoadingReceiptTypes] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);

  useEffect(() => {
    const fetchReceiptTypes = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/receipt-types`);
        setReceiptTypes(data);
      } catch (err) {
        console.error('Failed to fetch receipt types:', err);
      } finally {
        setIsLoadingReceiptTypes(false);
      }
    };
    fetchReceiptTypes();
  }, []);

  useEffect(() => {
    if (!invoice) return;
    const fetchImages = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${invoice.id}/images`);
        setFormInvoice(prev => ({
          ...prev,
          existingImages: res.data.images,
          time: invoice.time ? invoice.time.substring(0, 5) : '',
        }));
      } catch (err) {
        console.error('Failed to fetch invoice images:', err);
      }
    };
    fetchImages();
  }, [invoice]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formInvoice, [name]: name === 'time' ? `${value}:00` : value };
    setFormInvoice(updated);

    if (['amount', 'conversionRate', 'targetCurrency'].includes(name)) {
      updateConvertedAmount(updated);
    }
  };

  const updateConvertedAmount = (form) => {
    const { amount, conversionRate, targetCurrency } = form;
    if (amount && conversionRate && targetCurrency) {
      const convertedAmount = (amount * conversionRate).toFixed(2);
      setFormInvoice(prev => ({ ...prev, convertedAmount }));
    } else {
      setFormInvoice(prev => ({ ...prev, convertedAmount: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const oversized = files.find(file => file.size > MAX_IMAGE_SIZE);
    if (oversized) {
      alert(`⚠️ ${oversized.name} is too large. Max 10MB allowed.`);
      return;
    }

    files.forEach((file, i) => {
      console.log(`📷 File ${i + 1}: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`);
    });

    setFormInvoice(prev => ({ ...prev, images: files }));
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/images`, {
        data: { imageUrl: imageToDelete },
      });
      setFormInvoice(prev => ({
        ...prev,
        existingImages: prev.existingImages.filter(img => img.imageUrl !== imageToDelete),
      }));
      setImageToDelete(null);
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleSubmit = () => {
    if (
      (!formInvoice.images || formInvoice.images.length === 0) &&
      (!formInvoice.existingImages || formInvoice.existingImages.length === 0)
    ) {
      alert('Please upload at least one image before submitting.');
      return;
    }

    console.log("📤 Submitting with:", formInvoice.images.map(f => f.name));
    onSave(formInvoice);
    alert(invoice ? 'Invoice updated successfully!' : 'Invoice added successfully!');
    window.location.reload(); // optional: use callback
  };

  return (
    <div className="popup-overlay fancy-popup">
      <div className="popup fancy-popup-window">
        <h3>{invoice ? 'Edit Invoice' : 'Add Invoice'}</h3>

        <input type="text" name="invoiceNumber" placeholder="Invoice Number" value={formInvoice.invoiceNumber} onChange={handleInputChange} />
        <input type="text" name="receiptNumber" placeholder="Receipt Number" value={formInvoice.receiptNumber} onChange={handleInputChange} />
        <input type="date" name="date" value={formInvoice.date} onChange={handleInputChange} />
        <input type="time" name="time" value={formInvoice.time.substring(0, 5)} onChange={handleInputChange} />

        <select name="receiptType" value={formInvoice.receiptType} onChange={handleInputChange} disabled={isLoadingReceiptTypes}>
          <option value="">{isLoadingReceiptTypes ? 'Loading...' : 'Select Receipt Type'}</option>
          {receiptTypes.map((type, i) => (
            <option key={i} value={type}>{type}</option>
          ))}
        </select>

        <textarea name="narrative" placeholder="Narrative" value={formInvoice.narrative} onChange={handleInputChange} />
        <input type="number" name="amount" placeholder="Amount" value={formInvoice.amount} onChange={handleInputChange} />

        <select name="currency" value={formInvoice.currency} onChange={handleInputChange}>
          <option value="">Select Currency</option>
          {availableCurrencies.map((cur, i) => (
            <option key={i} value={cur}>{cur}</option>
          ))}
        </select>

        <select name="targetCurrency" value={formInvoice.targetCurrency} onChange={handleInputChange}>
          <option value="">Select Target Currency</option>
          {availableCurrencies.map((cur, i) => (
            <option key={i} value={cur}>{cur}</option>
          ))}
        </select>

        <input type="number" name="conversionRate" placeholder="Conversion Rate" value={formInvoice.conversionRate} onChange={handleInputChange} />
        <input type="text" name="convertedAmount" placeholder="Converted Amount" value={formInvoice.convertedAmount} readOnly />

        {/* Existing Images */}
        {formInvoice.existingImages?.length > 0 && (
          <div className="existing-images">
            <h4>Existing Images</h4>
            <div className="existing-images-list">
              {formInvoice.existingImages.map((img, i) => (
                <div key={i} className="existing-image-item">
                  <img
                    src={`${process.env.REACT_APP_IMAGE_BASE_URL}/${img.imageUrl.split('/').pop()}`}
                    alt={`Invoice Image ${i + 1}`}
                    className="invoice-image-thumbnail"
                    onClick={() => setFullScreenImage(img.imageUrl)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <input type="file" name="images" multiple accept="image/*" capture="environment" onChange={handleImageChange} />

        <div className="popup-buttons">
          <button
            onClick={handleSubmit}
            className="fancy-button"
            disabled={
              (!formInvoice.images || formInvoice.images.length === 0) &&
              (!formInvoice.existingImages || formInvoice.existingImages.length === 0)
            }
          >
            {invoice ? 'Update Invoice' : 'Add Invoice'}
          </button>
          <button onClick={onClose} className="fancy-button cancel-button">Cancel</button>
        </div>
      </div>

      {fullScreenImage && (
        <div className="full-screen-overlay" onClick={() => setFullScreenImage(null)}>
          <div className="full-screen-image-container">
            <img
              src={`${process.env.REACT_APP_IMAGE_BASE_URL}/${fullScreenImage.split('/').pop()}`}
              alt="Full Screen"
              className="full-screen-image"
            />
            <button className="close-full-screen-button fancy-button" onClick={() => setFullScreenImage(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceFormPopup;
