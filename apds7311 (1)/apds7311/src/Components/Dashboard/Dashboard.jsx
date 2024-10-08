import React, { useState } from 'react';
import './Dashboard.css'; // Create a new CSS file for the dashboard styling

const Dashboard = () => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [provider, setProvider] = useState('SWIFT');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [activeView, setActiveView] = useState('makePayment'); // State to manage active view

  // Handle payment submission
  const handlePayment = async () => {
    if (!amount || !currency || !provider || !accountNumber || !swiftCode) {
      alert('Please fill all required fields.');
      return;
    }

    const paymentData = {
      amount,
      currency,
      provider,
      accountNumber,
      swiftCode,
    };

    console.log('Sending payment data:', paymentData); // Added for debugging

    try {
      const response = await fetch('http://localhost:5000/pay', {
        method: 'POST', // Ensure method is POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Payment failed';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }

      const data = await response.json();
      alert('Payment successful!');
      // Clear the form fields after successful payment
      setAmount('');
      setCurrency('USD');
      setProvider('SWIFT');
      setAccountNumber('');
      setSwiftCode('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error occurred during the payment process');
    }
  };

  // Handle View Payments click
  const handleViewPayments = () => {
    alert('Waiting for admin approval.');
  };

  return (
    <div className="dashboard-container">
      <nav className="nav-panel">
        <button
          onClick={() => setActiveView('makePayment')}
          className={activeView === 'makePayment' ? 'active' : ''}
        >
          Make a Payment
        </button>
        <button
          onClick={handleViewPayments}
          className={activeView === 'viewPayments' ? 'active' : ''}
        >
          View Payments
        </button>
      </nav>

      {activeView === 'makePayment' ? (
        <div>
          <h1>Make an International Payment</h1>

          <div className="form-group">
            <label>Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label>Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="ZAR">ZAR</option>
            </select>
          </div>

          <div className="form-group">
            <label>Provider:</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="SWIFT">SWIFT</option>
            </select>
          </div>

          <div className="form-group">
            <label>Recipient Account Number:</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
            />
          </div>

          <div className="form-group">
            <label>SWIFT Code:</label>
            <input
              type="text"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value)}
              placeholder="Enter SWIFT code"
            />
          </div>

          <div className="form-group">
            <button onClick={handlePayment}>Pay Now</button>
          </div>
        </div>
      ) : (
        <div>
          <h1>View Payments</h1>
          <p>Waiting for admin approval.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;