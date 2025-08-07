"use client";

import { useProducts } from "../../hooks/useProducts";


const FetchingTestPage = () => {
    // Use the same hook to get all product data and status
    const { allProducts, loading, error, refetchProducts } = useProducts();

    return (
        <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
            <h1>Data Fetching Test Page</h1>
            <p>This page uses the shared `useProducts` hook to fetch data with no UI.</p>

            <button
                onClick={refetchProducts}
                disabled={loading}
                style={{ margin: '1rem 0', padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
                {loading ? 'Loading...' : 'Refetch All Products'}
            </button>

            <hr />

            {loading && <p>Loading...</p>}

            {error && <div style={{ color: 'red' }}>
                <h2>Error:</h2>
                <pre>{error}</pre>
            </div>}

            {!loading && !error && (
                <div>
                    <h2>Fetched Data (`allProducts`):</h2>
                    <pre style={{
                        // backgroundColor: '#f0f0f0',
                        padding: '1rem',
                        borderRadius: '5px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}>
                        {/* Display the raw JSON data */}
                        {JSON.stringify(allProducts, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default FetchingTestPage;