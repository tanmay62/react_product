// fetchdata.js
export const fetchProducts = async () => {
  const response = await fetch('http://localhost:5000/products');
  return await response.json(); // Ensure it always returns an array
};

export const saveProducts = async (products) => {
  const response = await fetch('http://localhost:5000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }), // Expect products array
  });

  if (!response.ok) {
      throw new Error('Error saving products');
  }

  return await response.json(); // Return saved products
};

export const uploadImage = async (formData) => {
  const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
  });

  if (!response.ok) {
      throw new Error('Error uploading image');
  }

  return await response.json();
};

export const deleteProduct = async (productId) => {
  const response = await fetch(`http://localhost:5000/products/${productId}`, {
      method: 'DELETE',
  });

  if (!response.ok) {
      throw new Error('Error deleting product');
  }

  return await response.json();
};