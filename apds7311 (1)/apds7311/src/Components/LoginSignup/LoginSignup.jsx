import React, { useState } from 'react';
import './LoginSignup.css';

import user_icon from '../Assests/user.png';
import password_icon from '../Assests/padlock.png';
import account_icon from '../Assests/account.png'; 

const Requirements = () => (
    <div className="requirements">
        <h3>Requirements:</h3>
        <ul>
            <li><strong>Username:</strong> 3-20 characters, letters, numbers, and underscores only</li>
            <li><strong>ID Number:</strong> 6-20 numeric digits</li>
            <li><strong>Password:</strong> 6-20 characters, letters, numbers, and special characters (@#$%^&*)</li>
            <li><strong>Account Number:</strong> 6-20 numeric digits</li>
        </ul>
    </div>
);

const LoginSignup = ({ onLoginSuccess }) => {
    const [action, setAction] = useState("Login");

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async () => {
        const url = action === "Login" ? 'http://localhost:5000/login' : 'http://localhost:5000/signup';
        const payload = { password };

        if (action === "Sign Up") {
            payload.username = username;
            payload.fullName = fullName;
            payload.idNumber = idNumber;
            payload.accountNumber = accountNumber;
        } else {
            payload.username = username;
            payload.accountNumber = accountNumber;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                if (action === "Login") {
                    onLoginSuccess();
                }
            } else {
                alert(data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error occurred during submission');
        }
    };

    return (
        <div className='container'>
            <div className='header'>
                <div className='text'>{action}</div>
                <div className='underline'></div>
            </div>

            <div className="submit-container">
                <div
                    className={action === "Login" ? "submit gray" : "submit"}
                    onClick={() => setAction("Login")}
                >
                    Login
                </div>
                <div
                    className={action === "Sign Up" ? "submit gray" : "submit"}
                    onClick={() => setAction("Sign Up")}
                >
                    Sign Up
                </div>
            </div>

            <div className='inputs'>
                {action === "Sign Up" && (
                    <>
                        <div className='input'>
                            <img src={user_icon} alt="User Icon" />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className='input'>
                            <img src={user_icon} alt="User Icon" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className='input'>
                            <img src={account_icon} alt="Account Icon" />
                            <input
                                type="text"
                                placeholder="ID Number"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                            />
                        </div>

                        <div className='input'>
                            <img src={account_icon} alt="Account Icon" />
                            <input
                                type="text"
                                placeholder="Account Number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {action === "Login" && (
                    <>
                        <div className='input'>
                            <img src={user_icon} alt="User Icon" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className='input'>
                            <img src={account_icon} alt="Account Icon" />
                            <input
                                type="text"
                                placeholder="Account Number"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className='input'>
                    <img src={password_icon} alt="Password Icon" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {action === "Sign Up" && <Requirements />} {/* Show requirements only for signup */}

            <div className="submit" onClick={handleSubmit}>
                Submit
            </div>
        </div>
    );
};

export default LoginSignup;
