import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState(''); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer', // default role
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/users');
        if (response.data && Array.isArray(response.data.users)) {
          setUsers(response.data.users);
        } else {
          console.error('Unexpected response format', response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };

    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/users', formValues);
      if (response.data && response.data.success) {
        alert('User added successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to add user', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormValues({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setPopupMode('edit');
    setShowPopup(true);
  };

  const handleUpdateUser = async () => {
    try {
      const response = await axios.put(`http://localhost:5001/api/users/${selectedUser.id}`, formValues);
      if (response.data && response.data.success) {
        alert('User updated successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:5001/api/users/${id}`);
        if (response.data && response.data.success) {
          alert('User deleted successfully!');
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  const handleSubmit = () => {
    if (popupMode === 'add') {
      handleAddUser();
    } else if (popupMode === 'edit') {
      handleUpdateUser();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  return (
    <div className="user-container">
      <h2>Users</h2>
      <button className="add-user-button fancy-button" onClick={() => { setPopupMode('add'); setShowPopup(true); }}>Add User</button>

      {showPopup && (
        <div className="popup-overlay fancy-popup">
          <div className="popup fancy-popup-window">
            <h3>{popupMode === 'add' ? 'Add User' : 'Edit User'}</h3>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formValues.username}
              onChange={handleInputChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formValues.email}
              onChange={handleInputChange}
            />
            {popupMode === 'add' && (
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formValues.password}
                onChange={handleInputChange}
              />
            )}
            <select
              name="role"
              value={formValues.role}
              onChange={handleInputChange}
              className="role-dropdown"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <div className="popup-buttons">
              <button onClick={handleSubmit} className="fancy-button">{popupMode === 'add' ? 'Add User' : 'Update User'}</button>
              <button onClick={() => setShowPopup(false)} className="fancy-button cancel-button">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table className="user-table fancy-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="fancy-table-row">
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <div className="action-buttons">
                  <button className="fancy-button edit-button" onClick={() => handleEditUser(user)}>Edit</button>
                  <button className="fancy-button delete-button" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
