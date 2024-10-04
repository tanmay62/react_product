import React, { useEffect, useState } from 'react';
import { fetchProducts, deleteProduct } from '../services/fetchdata';
import { Bar, Pie } from 'react-chartjs-2';
import Dialog from './Dialog';
import jsPDF from 'jspdf';
import {
  Chart as ChartJS,
  CategoryScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const ProductList = ({ products, setProducts }) => {
  //const [products, setProducts] = useState([]);
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
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const prepareChartData = (data) => {
    const categories = [...new Set(data.map((product) => product.category || product?.products?.[0]?.category))];
    const quantities = categories.map((category) =>
      data.filter((product) => product.category === category || product?.products?.[0]?.category === category).reduce(
        (sum, product) => sum + Number(product.quantity || product?.products?.[0]?.quantity),
        0
      )
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

  const handleDelete = async () => {
    try {
      if (productToDelete) {
        await deleteProduct(productToDelete.id);
        setProducts(products.filter((product) => product.id !== productToDelete.id));
        setShowConfirmDialog(false);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowConfirmDialog(true);
  };

  const generatePDF = async (event) => {
    // Prevent default event handling if called from an event
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text('Product List', 10, 10);
    pdf.setFontSize(12);

    let yPosition = 30; // Start position for product details

    // Iterate over products and add details to the PDF
    for (const [index, product] of products.entries()) {
      pdf.text(`Name: ${product.name}`, 10, yPosition);
      pdf.text(`Category: ${product.category}`, 10, yPosition + 10);
      pdf.text(`Quantity: ${product.quantity}`, 10, yPosition + 20);

      // If the product has an image path, try loading the image and converting it to base64
      if (product.thumbnail) {
        try {
          // Convert the image URL to a Base64-encoded image
          const base64Image = await convertImageToBase64(product.thumbnail);

          if (base64Image) {
            pdf.addImage(base64Image, 'PNG', 120, yPosition - 10, 40, 40); // Adjust image placement
            pdf.link(120, yPosition - 10, 40, 40, { url: product.thumbnail }); // Create a clickable image link
          }
        } catch (error) {
          console.error(`Error loading image for product: ${product.name}`, error);
          pdf.text('Image failed to load', 120, yPosition + 10); // Add text if image loading fails
        }
      }

      // Update yPosition for the next product
      yPosition += 50;

      // Check if a new page is needed
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 30; // Reset yPosition for the new page
      }
    }

    // Save the generated PDF
    try {
      pdf.save('product_list.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Handle cross-origin images if needed

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert the image to base64
        const base64Image = canvas.toDataURL('image/png');
        resolve(base64Image); // Return the base64 string
      };

      img.onerror = (error) => {
        console.error('Image failed to load:', error);
        reject(error); // Reject the promise if the image fails to load
      };

      img.src = url;
    });
  };

  return (
    <div>
      <div id="product-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '20px' }}>
        {products.map((product) => (
          <div
            className="product-card"
            key={product.id}
            style={{
              flex: '1 1 calc(33.333% - 16px)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '20px', // Added more padding for spacing
              textAlign: 'center',
              display: 'flex', // Make the card a flex container
              flexDirection: 'column', // Ensure the content stacks vertically
              justifyContent: 'space-between', // Space between content and button
              height: '300px', // Fixed height for consistent sizing
              boxSizing: 'border-box' // Ensure padding is included in height/width calculation
            }}
          >
            <img
              src={product.thumbnail}
              alt={product.name}
              style={{
                height: '100px', // Increased image size to fill space better
                borderRadius: '4px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto',
                width: '100px',
                objectFit: 'contain' // Ensure image fits without distortion
              }}
            />
            <div style={{ marginTop: '10px' }}>
              <p><strong>Product Name:</strong> {product.name}</p>
              <p><strong>Category:</strong> {product.category}</p>
              <p><strong>Quantity:</strong> {product.quantity}</p>
            </div>
            <button
              onClick={() => handleDeleteClick(product)}
              style={{
                marginTop: 'auto', // Push the button to the bottom of the card
                background: 'red',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                alignSelf: 'center', // Center the button horizontally
                width: '100px' // Consistent button width
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <button onClick={generatePDF} style={{ marginBottom: '20px' }}>
        Export to PDF
      </button>
      <div style={{ marginTop: '40px' }}>
        <h2>Bar Chart</h2>
        <div style={{ height: '400px', width: '400px' }}>
          <Bar data={barChartData} />
        </div>
      </div>
      <div style={{ marginTop: '40px' }}>
        <h2>Pie Chart</h2>
        <div style={{ height: '400px', width: '400px' }}>
          <Pie data={pieChartData} />
        </div>
      </div>
      <Dialog show={showConfirmDialog} title="Confirm Deletion" message={`Are you sure you want to delete ${productToDelete?.name}?`} onConfirm={handleDelete} onCancel={() => setShowConfirmDialog(false)} />
    </div>
  );
};

export default ProductList;