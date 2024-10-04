import React, { useState } from 'react';
import { saveProducts, uploadImage } from '../services/fetchdata';

const ProductForm = () => {
  const [errors, setErrors] = useState([]);
  const [newProducts, setNewProducts] = useState([{ name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
  const [existingProducts, setExistingProducts] = useState([]);

  const validateForm = () => {
    let formIsValid = true;
    const newErrors = [];

    newProducts.forEach((product, index) => {
      const productErrors = {};
      if (!product.name || product.name.length < 3) {
        productErrors.name = 'Product name must be at least 3 characters.';
        formIsValid = false;
      }
      if (!product.category) {
        productErrors.category = 'Category is required.';
        formIsValid = false;
      }
      if (!product.quantity || product.quantity <= 0) {
        productErrors.quantity = 'Quantity must be a positive number.';
        formIsValid = false;
      }
      if (!product.thumbnail) {
        productErrors.thumbnail = 'Image upload is required.';
        formIsValid = false;
      }
      newErrors[index] = productErrors;
    });

    setErrors(newErrors);
    return formIsValid;
  };

  // Handle input field changes
  const handleInputChange = (index, field, value) => {
    const updatedProducts = [...newProducts];
    updatedProducts[index][field] = value;
    setNewProducts(updatedProducts);
  };

  // Handle image upload and preview
  const handleImageUpload = async (index, event) => {
    const file = event.target.files[0];

    // Prepare the form data for image upload
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await uploadImage(formData);
      if (response && response.path) {
        handleInputChange(index, 'imagePath', response.path);
      }

      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        handleInputChange(index, 'thumbnail', reader.result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  // Add a new product row
  const handleAddProductRow = () => {
    setNewProducts([...newProducts, { name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
  };

  // Remove a product row
  const handleRemoveProductRow = (index) => {
    const updatedProducts = newProducts.filter((_, i) => i !== index);
    setNewProducts(updatedProducts);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form is valid. Submitting...', newProducts);
      // Add your submit logic here (e.g., save to API or backend)
    } else {
      console.log('Form validation failed.');
    }
    try {
      // Save the new products
      await saveProducts(newProducts);
      
      // Update existing products and clear new product entries
      console.log(newProducts)
      setExistingProducts((prev) => [...prev, newProducts]);
      //setNewProducts([{ name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
    } catch (error) {
      console.error('Failed to save products:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {existingProducts.map((product, index) => (
        <div key={index} className="product-row">
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleInputChange(index, 'name', e.target.value)}
            placeholder="Product Name"
            required
          />
          {errors[index]?.name && <span style={{ color: 'red' }}>{errors[index].name}</span>}
          
          <input
            type="text"
            value={product.category}
            onChange={(e) => handleInputChange(index, 'category', e.target.value)}
            placeholder="Category"
            required
          />
          {errors[index]?.category && <span style={{ color: 'red' }}>{errors[index].category}</span>}
          
          <input
            type="number"
            value={product.quantity}
            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
            placeholder="Quantity"
            required
          />
          {errors[index]?.quantity && <span style={{ color: 'red' }}>{errors[index].quantity}</span>}
          
          <input type="file" onChange={(e) => handleImageUpload(index, e)} />
          {product.thumbnail && (
            <div className="image-preview">
              <img src={product.thumbnail} alt="Preview" width="100" />
              <button style={{ cursor: 'pointer' }} type="button" onClick={() => handleInputChange(index, 'thumbnail', null)}>Delete</button>
            </div>
          )}
          {errors[index]?.thumbnail && <span style={{ color: 'red' }}>{errors[index].thumbnail}</span>}
          
          <button style={{ cursor: 'pointer' }} type="button" onClick={() => handleRemoveProductRow(index)}>Remove</button>
        </div>
      ))}
      <button style={{ cursor: 'pointer' }} type="button" onClick={handleAddProductRow}>Add Product</button>
      <button style={{ cursor: 'pointer' }} type="submit">Save Products</button>
    </form>
  );
};

export default ProductForm;