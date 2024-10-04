import React, { useEffect, useState } from 'react';
import { saveProducts, fetchProducts, deleteProduct, uploadImage } from '../services/fetchdata';
import jsPDF from 'jspdf';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    LinearScale,
} from 'chart.js';
import Dialog from './Dialog'; // Adjust if necessary

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const ProductFormList = () => {
    const [products, setProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([{ name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
    const [errors, setErrors] = useState([]);
    const [barChartData, setBarChartData] = useState({ labels: [], datasets: [] });
    const [pieChartData, setPieChartData] = useState({ labels: [], datasets: [] });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        prepareChartData(products);
    }, [products]);

    const loadProducts = async () => {
        try {
            const data = await fetchProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleInputChange = (index, field, value) => {
        const updatedProducts = [...newProducts];
        updatedProducts[index][field] = value;
        setNewProducts(updatedProducts);
    };

    const handleImageUpload = async (index, event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await uploadImage(formData);
            if (response && response.path) {
                handleInputChange(index, 'imagePath', response.path);
            }

            const reader = new FileReader();
            reader.onload = () => {
                handleInputChange(index, 'thumbnail', reader.result);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    };

    const handleAddProductRow = () => {
        setNewProducts([...newProducts, { name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
    };

    const handleRemoveProductRow = (index) => {
        const updatedProducts = newProducts.filter((_, i) => i !== index);
        setNewProducts(updatedProducts);
    };

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
            if (!product.imagePath) {
                productErrors.thumbnail = 'Image upload is required.';
                formIsValid = false;
            }
            newErrors[index] = productErrors;
        });

        setErrors(newErrors);
        return formIsValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const savedProducts = await saveProducts(newProducts);
                setProducts((prev) => [...prev, ...savedProducts]);
                setNewProducts([{ name: '', category: '', quantity: '', imagePath: '', thumbnail: '' }]);
            } catch (error) {
                console.error('Failed to save products:', error);
            }
        }
    };

    const handleDeleteClick = async (product) => {
        setProductToDelete(product);
        setShowConfirmDialog(true);
    };

    const handleDelete = async () => {
        try {
            await deleteProduct(productToDelete.id);
            setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
            setShowConfirmDialog(false);
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const generatePDF = async () => {
        const pdf = new jsPDF();
        pdf.setFontSize(20);
        pdf.text('Product List', 10, 10);
        pdf.setFontSize(12);
        let yPosition = 30;
    
        for (const [index, product] of products.entries()) {
            pdf.text(`Name: ${product.name}`, 10, yPosition);
            pdf.text(`Category: ${product.category}`, 10, yPosition + 10);
            pdf.text(`Quantity: ${product.quantity}`, 10, yPosition + 20);
    
            if (product.thumbnail) {
                try {
                    const base64Image = await convertImageToBase64(product.thumbnail);
                    if (base64Image) {
                        // Adding a clickable link for the image
                        pdf.addImage(base64Image, 'PNG', 120, yPosition - 10, 40, 40);
                        pdf.link(120, yPosition - 10, 40, 40, { url: product.imagePath }); // Ensure this points to the correct image URL
                    }
                } catch (error) {
                    pdf.text('Image failed to load', 120, yPosition + 10);
                }
            }
    
            yPosition += 50;
            if (yPosition > 280) {
                pdf.addPage();
                yPosition = 30;
            }
        }
    
        pdf.save('product_list.pdf');
    };    

    const convertImageToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = (error) => reject(error);
            img.src = url;
        });
    };

    const prepareChartData = (data) => {
        const categories = [...new Set(data.map((product) => product.category))];
        const quantities = categories.map((category) =>
            data.filter((product) => product.category === category).reduce((sum, product) => sum + Number(product.quantity), 0)
        );

        setBarChartData({
            labels: categories,
            datasets: [
                {
                    label: 'Quantity by Category',
                    data: quantities,
                    backgroundColor: 'rgba(75,192,192,0.4)',
                    borderColor: 'rgba(75,192,192,1)',
                    borderWidth: 1,
                },
            ],
        });

        const totalProducts = quantities.reduce((a, b) => a + b, 0);
        const categoryQuantities = quantities.map((quantity) => (quantity / totalProducts) * 100);

        setPieChartData({
            labels: categories,
            datasets: [
                {
                    data: categoryQuantities,
                    backgroundColor: ['rgba(255,99,132,0.4)', 'rgba(54,162,235,0.4)', 'rgba(255,206,86,0.4)', 'rgba(75,192,192,0.4)', 'rgba(153,102,255,0.4)'],
                    borderColor: ['rgba(255,99,132,1)', 'rgba(54,162,235,1)', 'rgba(255,206,86,1)', 'rgba(75,192,192,1)', 'rgba(153,102,255,1)'],
                    borderWidth: 1,
                },
            ],
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Product Form */}
            <form onSubmit={handleSubmit}>
                {newProducts.map((product, index) => (
                    <div key={index} className="product-row" style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                            placeholder="Product Name"
                            style={{ flex: 1, padding: '10px' }}
                            required
                        />
                        {errors[index]?.name && <span style={{ color: 'red' }}>{errors[index].name}</span>}
                        <input
                            type="text"
                            value={product.category}
                            onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                            placeholder="Category"
                            style={{ flex: 1, padding: '10px' }}
                            required
                        />
                        {errors[index]?.category && <span style={{ color: 'red' }}>{errors[index].category}</span>}
                        <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleInputChange(index, 'quantity', e.target.value)}
                            placeholder="Quantity"
                            style={{ flex: 1, padding: '10px' }}
                            required
                        />
                        {errors[index]?.quantity && <span style={{ color: 'red' }}>{errors[index].quantity}</span>}
                        <input type="file" onChange={(e) => handleImageUpload(index, e)} style={{ flex: 1 }} />
                        {product.thumbnail && (
                            <div className="image-preview" style={{ flex: 1, position: 'relative' }}>
                                <img src={product.thumbnail} alt="Preview" width="100" />
                                <button type="button" onClick={() => handleInputChange(index, 'thumbnail', null)} style={{ cursor: 'pointer', position: 'absolute', top: '5px', right: '5px' }}>Remove</button>
                            </div>
                        )}
                        {errors[index]?.thumbnail && <span style={{ color: 'red' }}>{errors[index].thumbnail}</span>}
                        <button type="button" onClick={() => handleRemoveProductRow(index)} style={{ cursor: 'pointer', background: 'red', color: 'white', padding: '10px', borderRadius: '5px' }}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={handleAddProductRow} style={{ cursor: 'pointer', padding: '10px', margin: '10px', background: 'green', color: 'white', borderRadius: '5px' }}>Add Product</button>
                <button type="submit" style={{ cursor: 'pointer', padding: '10px', margin: '10px', background: 'blue', color: 'white', borderRadius: '5px' }}>Save Products</button>
            </form>

            {/* Product List */}
            <div id="product-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
                {products.map((product) => (
                    <div key={product.id} className="product-card" style={{ flex: '1 1 calc(33.333% - 16px)', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <img src={product.thumbnail} alt={product.name} style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                        <div>
                            <p><strong>Product Name:</strong> {product.name}</p>
                            <p><strong>Category:</strong> {product.category}</p>
                            <p><strong>Quantity:</strong> {product.quantity}</p>
                        </div>
                        <button onClick={() => handleDeleteClick(product)} style={{ cursor: 'pointer', background: 'red', color: 'white', padding: '8px 15px', borderRadius: '4px', alignSelf: 'center', width: '100px' }}>Delete</button>
                    </div>
                ))}
            </div>

            {/* Export to PDF */}
            <button onClick={generatePDF} style={{ cursor: 'pointer', padding: '10px', margin: '10px', background: 'purple', color: 'white', borderRadius: '5px' }}>Export to PDF</button>

            {/* Bar Chart */}
            <div style={{ marginTop: '40px' }}>
                <h2>Bar Chart</h2>
                <div style={{ height: '400px', width: '400px' }}>
                    <Bar data={barChartData} />
                </div>
            </div>

            {/* Pie Chart */}
            <div style={{ marginTop: '40px' }}>
                <h2>Pie Chart</h2>
                <div style={{ height: '400px', width: '400px' }}>
                    <Pie data={pieChartData} />
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                show={showConfirmDialog}
                title="Confirm Deletion"
                message={`Are you sure you want to delete ${productToDelete?.name}?`}
                onConfirm={handleDelete}
                onCancel={() => setShowConfirmDialog(false)}
            />
        </div>
    );
};

export default ProductFormList;