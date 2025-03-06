export const redirectToLogin = (navigate, setUser) => {
    // Clear user from storage
    localStorage.removeItem('user');

    // Clear user in context
    setUser(null);

    // Redirect to login page
    navigate('/');
};
