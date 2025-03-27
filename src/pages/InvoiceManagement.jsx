import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import InvoiceFormPopup from './InvoiceFormPopup';
import './InvoiceManagement.css';
import { Buffer } from 'buffer';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const { user } = useContext(UserContext);
  const [userEmail, setUserEmail] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [popupMode, setPopupMode] = useState(''); // 'add', 'edit', 'send'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [receiptTypes] = useState(['Invoice', 'Gas', 'Support Office', 'Other']);

  useEffect(() => {
    fetchInvoices();
    fetchUserEmail();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices`);
      const fetched = response?.data?.invoices ?? [];
      setInvoices(fetched.map((inv) => ({ ...inv, date: inv.date.split('T')[0] })));
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    }
  };

  const fetchUserEmail = async () => {
    try {
      if (user?.username) {
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/users/username/${user.username}`);
        setUserEmail(res?.data?.user?.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch user email', error);
    }
  };

  const buildFormData = (invoice) => {
    const formData = new FormData();
    for (const key in invoice) {
      if (key === 'images' && invoice.images?.length) {
        invoice.images.forEach((img) => formData.append('images', img));
      } else {
        formData.append(key, invoice[key]);
      }
    }
    formData.append('createdBy', user?.username || user?.id || 'Unknown');
    return formData;
  };

  const handleAddInvoice = async (invoice) => {
    try {
      const formData = buildFormData(invoice);
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/invoices`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.invoiceId) {
        alert('Invoice added successfully!');
        fetchInvoices();
        setShowPopup(false);
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

  const handleUpdateInvoice = async (invoice) => {
    try {
      const formData = buildFormData(invoice);
      const response = await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${invoice.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.message === 'Invoice updated') {
        alert('Invoice updated successfully!');
        fetchInvoices();
        setShowPopup(false);
      }
    } catch (error) {
      console.error('Failed to update invoice', error);
    }
  };

  const handleDeleteInvoice = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this invoice?');
    if (!confirmed) return;

    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${id}`);
      if (response.data?.message === 'Deleted') {
        alert('Invoice deleted successfully!');
        fetchInvoices();
      }
    } catch (error) {
      console.error('Failed to delete invoice', error);
    }
  };

  const handleSendMail = (invoice) => {
    setSelectedInvoice(invoice);
    setPopupMode('send');
    setShowMailPopup(true);
  };

  const handleSendMailSubmit = async () => {
    if (!userEmail) {
      alert('Cannot send email: user email missing.');
      return;
    }

    try {
      const imagesResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/invoices/${selectedInvoice.id}/images`);
      const imageList = imagesResponse.data?.images ?? [];

      const attachments = await Promise.all(
        imageList.map(async (img) => {
          const url = `${process.env.REACT_APP_API_BASE_URL}/${img.imageUrl}`;
          const res = await axios.get(url, { responseType: 'arraybuffer' });

          return {
            filename: url.split('/').pop(),
            content: Buffer.from(res.data, 'binary').toString('base64'),
            encoding: 'base64',
          };
        })
      );

      const payload = {
        from: userEmail,
        to: recipientEmail,
        subject: `Invoice #${selectedInvoice.invoiceNumber}`,
        body: `
Invoice Details:
- Receipt #: ${selectedInvoice.receiptNumber}
- Invoice #: ${selectedInvoice.invoiceNumber}
- Date: ${selectedInvoice.date}
- Time: ${selectedInvoice.time}
- Type: ${selectedInvoice.receiptType}
- Narrative: ${selectedInvoice.narrative}
- Amount: ${selectedInvoice.amount} ${selectedInvoice.currency}
        `,
        invoiceId: selectedInvoice.id,
        attachments,
      };

      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/send-mail`, payload);
      if (response.data?.success) {
        alert('Email sent successfully!');
        setShowMailPopup(false);
      } else {
        alert('Failed to send email.');
      }
    } catch (err) {
      console.error('Send email failed', err);
      alert('An error occurred while sending email.');
    }
  };

  return (
    <div className="invoice-container">
      <h2>Invoices</h2>
      <button className="add-invoice-button fancy-button" onClick={() => {
        setPopupMode('add');
        setShowPopup(true);
      }}>
        Add Invoice
      </button>

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
