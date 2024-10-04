// src/components/ProductPage.js

import React, { useState, useEffect } from 'react';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../services/fetchdata';
import ProductForm from './ProductForm';
import ProductList from './ProductList';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [shouldReload, setShouldReload] = useState(false);

  // Fetch products when the component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  // Reload products when `shouldReload` is true
  useEffect(() => {
    if (shouldReload) {
      loadProducts();
      setShouldReload(false); // Reset the flag
    }
  }, [shouldReload]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Invalid data format:', data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSaveProduct = async (product) => {
    if (editMode) {
      try {
        await updateProduct(currentProduct.id, product);
        setEditMode(false);
        setCurrentProduct(null);
        setShouldReload(true); // Trigger reload after update
      } catch (error) {
        console.error('Error updating product:', error);
      }
    } else {
      try {
        await addProduct(product);
        setShouldReload(true); // Trigger reload after add
      } catch (error) {
        console.error('Error adding product:', error);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(products.filter(product => product.id !== id));
      setShouldReload(true); // Trigger reload after delete
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div>
      <ProductForm 
        onSave={handleSaveProduct}
        editMode={editMode}
        currentProduct={currentProduct}
        setEditMode={setEditMode}
      />
      <ProductList 
        products={products}
        onDelete={handleDeleteProduct}
        setCurrentProduct={setCurrentProduct}
        setEditMode={setEditMode}
      />
    </div>
  );
};

export default ProductPage;