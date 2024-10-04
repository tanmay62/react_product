import React, { useState } from 'react';
import ProductFormList from './components/ProductFormList';

const App = () => {
    const [products, setProducts] = useState([]);

    return (
        <div>
            <h1>Product Management</h1>
            <ProductFormList products={products} setProducts={setProducts} />
        </div>
    );
};

export default App;