import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import InvoiceFormPopup from './InvoiceFormPopup';
import './InvoiceManagement.css';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const { user } = useContext(UserContext);
  const [userEmail, setUserEmail] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [popupMode, setPopupMode] = useState(''); // 'add', 'edit', 'delete', or 'send'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [receiptTypes] = useState(['Invoice', 'Gas', 'Support Office', 'Other']);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices`);
        if (response.data && Array.isArray(response.data.invoices)) {
          const formattedInvoices = response.data.invoices.map((invoice) => ({
            ...invoice,
            date: invoice.date.split('T')[0], // Extract only yyyy-mm-dd from date
          }));
          setInvoices(formattedInvoices);
        } else {
          console.error('Unexpected response format', response.data);
          setInvoices([]);
        }
      } catch (error) {
        console.error('Failed to fetch invoices', error);
      }
    };

    const fetchUserEmail = async () => {
      if (user?.username) {
        // for debuging
        // console.log('Fetching email for user:', user.username);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/username/${user.username}`);
          if (response.data && response.data.user) {
            setUserEmail(response.data.user.email);
          } else {
            console.error('User email not found');
          }
        } catch (error) {
          console.error('Failed to fetch user email', error);
        }
      }
    };

    fetchInvoices();
    fetchUserEmail();
  }, [user]);

  const handleAddInvoice = async (invoice) => {
    try {
      const formData = new FormData();
      for (const key in invoice) {
        if (key === 'images' && invoice.images.length > 0) {
          invoice.images.forEach((image) => formData.append('images', image));
        } else {
          formData.append(key, invoice[key]);
        }
      }

      // Add createdBy field with the current user's info
      formData.append('createdBy', user?.username || user?.id || 'Unknown');

      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/invoices`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data && response.data.success) {
        alert('Invoice added successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add invoice', error);
    }
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setPopupMode('edit');
    setShowPopup(true);
  };

  const handleUpdateInvoice = async (updatedInvoice) => {
    try {
      const formData = new FormData();
      for (const key in updatedInvoice) {
        if (key === 'images' && updatedInvoice.images.length > 0) {
          updatedInvoice.images.forEach((image) => formData.append('images', image));
        } else {
          formData.append(key, updatedInvoice[key]);
        }
      }

      // Add createdBy field with the current user's info if not already set
      if (!updatedInvoice.createdBy) {
        formData.append('createdBy', user?.username || user?.id || 'Unknown');
      }

      const response = await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${updatedInvoice.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data && response.data.success) {
        alert('Invoice updated successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update invoice', error);
    }
  };

  const handleDeleteInvoice = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this invoice?');
    if (confirmDelete) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${id}`);
        if (response.data && response.data.success) {
          alert('Invoice deleted successfully!');
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to delete invoice', error);
      }
    }
  };

  const handleSendMail = (invoice) => {
    setSelectedInvoice(invoice);
    setPopupMode('send');
    setShowMailPopup(true);
  };

  const handleSendMailSubmit = async () => {
    console.log('Email from:', userEmail);
    try {
      if (!userEmail) {
        console.error('User email is missing. Cannot send email.');
        alert('Failed to send email. User email is missing.');
        return;
      }
  
      // Step 1: Fetch the images for the selected invoice
      let attachments = [];
      if (selectedInvoice && selectedInvoice.id) {
        try {
          const imagesResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${selectedInvoice.id}/images`);
          
          console.log('imagesResponse', imagesResponse.data.images);
          if (imagesResponse.data && Array.isArray(imagesResponse.data.images)) {
            // Iterate over each imageUrl to fetch the actual image data
            for (const image of imagesResponse.data.images) {
              const imageUrl = `${process.env.REACT_APP_API_BASE_URL}/${image.imageUrl}`; // Construct the full image URL
  
              // Fetch the image binary data
              const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer', // Expect binary data as response
              });
  
              if (imageResponse.status === 200) {
                attachments.push({
                  filename: imageUrl.split('/').pop(), // Extract the filename from the URL
                  content: Buffer.from(imageResponse.data, 'binary').toString('base64'), // Convert binary to base64
                  encoding: 'base64',
                });
              } else {
                console.error(`Failed to fetch image from URL: ${imageUrl}`);
              }
            }
          } else {
            console.error('No images found for this invoice');
          }
        } catch (imagesError) {
          console.error('Failed to fetch images for the invoice', imagesError);
        }
      }
  
      // Step 2: Prepare email data with attachments
      const emailData = {
        from: userEmail, // Use the fetched email
        to: recipientEmail,
        subject: `Summary Receipt Number (${selectedInvoice.receiptNumber}) and Invoice Number (${selectedInvoice.invoiceNumber})`,
        body: `Here are the details of the invoice:\n\nReceipt Number: ${selectedInvoice.receiptNumber}\nInvoice Number: ${selectedInvoice.invoiceNumber}\nDate: ${selectedInvoice.date}\nTime: ${selectedInvoice.time}\nReceipt Type: ${selectedInvoice.receiptType}\nNarrative: ${selectedInvoice.narrative}\nAmount: ${selectedInvoice.amount}\nCurrency: ${selectedInvoice.currency}`,
        invoiceId: selectedInvoice.id, // Include the invoice ID for reference
        attachments: attachments, // Include the images as attachments
      };
  
      console.log('Sending email with payload:', emailData);
  
      // Step 3: Send the email
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/send-mail`, emailData);
      if (response.data && response.data.success) {
        alert('Email sent successfully!');
        setShowMailPopup(false);
      } else {
        alert('Failed to send email.');
      }
    } catch (error) {
      console.error('Failed to send email', error);
      alert('An error occurred while sending the email.');
    }
  };
  

  return (
    <div className="invoice-container">
      <h2>Invoices</h2>
      <button className="add-invoice-button fancy-button" onClick={() => { setPopupMode('add'); setShowPopup(true); }}>Add Invoice</button>

      {showPopup && (
        <InvoiceFormPopup
          invoice={popupMode === 'edit' ? selectedInvoice : null}
          onSave={popupMode === 'add' ? handleAddInvoice : handleUpdateInvoice}
          onClose={() => setShowPopup(false)}
          receiptTypes={receiptTypes}
        />
      )}

      {showMailPopup && (
        <div className="popup-overlay fancy-popup">
          <div className="popup fancy-popup-window">
            <h3>Send Invoice Email</h3>
            <input
              type="email"
              name="recipientEmail"
              placeholder="Recipient Email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <div className="popup-buttons">
              <button onClick={handleSendMailSubmit} className="fancy-button">Send Email</button>
              <button onClick={() => setShowMailPopup(false)} className="fancy-button cancel-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table className="invoice-table fancy-table">
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Receipt Number</th>
            <th>Date</th>
            <th>Time</th>
            <th>Receipt Type</th>
            <th>Narrative</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="fancy-table-row">
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.receiptNumber}</td>
              <td>{invoice.date}</td>
              <td>{invoice.time}</td>
              <td>{invoice.receiptType}</td>
              <td>{invoice.narrative}</td>
              <td>{invoice.amount}</td>
              <td>{invoice.currency}</td>
              <td>
                {user?.role !== 'viewer' && (
                  <div className="action-buttons">
                    <button className="fancy-button edit-button" onClick={() => handleEditInvoice(invoice)}>Edit</button>
                    <button className="fancy-button delete-button" onClick={() => handleDeleteInvoice(invoice.id)}>Delete</button>
                    <button className="fancy-button mail-button" onClick={() => handleSendMail(invoice)}>Send Mail</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceManagement;
