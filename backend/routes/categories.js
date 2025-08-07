const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { status: 'active' },
            orderBy: { sortOrder: 'asc' },
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/categories/:id - Get a category by ID
router.get('/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// POST /api/categories - Create a new category
router.post('/', async (req, res) => {
    try {
        const { name, description, parent_category_id, imageUrl, sortOrder } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        const dataToCreate = {
            name,
            description,
            imageUrl,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            status: 'active',
        };

        // If a parent_category_id is provided, add the 'connect' object
        if (parent_category_id) {
            dataToCreate.categories = {
                connect: { id: parseInt(parent_category_id) }
            };
        }

        const newCategory = await prisma.category.create({
            data: dataToCreate,
        });

        res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint failed
            return res.status(409).json({ success: false, error: 'A category with this name already exists.' });
        }
        if (error.code === 'P2025') { // Foreign key constraint failed
            return res.status(404).json({ success: false, error: 'The specified parent category does not exist.' });
        }
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name, description, parent_category_id, image_url, status, sortOrder } = req.body;

        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, error: 'Invalid category ID' });
        }

        const dataToUpdate = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (parent_category_id !== undefined) dataToUpdate.parent_category_id = parent_category_id ? parseInt(parent_category_id) : null;
        if (image_url !== undefined) dataToUpdate.image_url = image_url;
        if (status !== undefined) dataToUpdate.status = status;
        if (sortOrder !== undefined) dataToUpdate.sortOrder = parseInt(sortOrder);

        if (parent_category_id !== undefined) {
            if (parent_category_id === null) {
                // To remove a parent, you 'disconnect'
                dataToUpdate.categories = { disconnect: true };
            } else {
                // To change or add a parent, you 'connect'
                dataToUpdate.categories = { connect: { id: parseInt(parent_category_id) } };
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: dataToUpdate,
        });

        res.json({ success: true, data: updatedCategory });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Category not found.' });
        }
        console.error(`Error updating category ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, error: 'Invalid category ID' });
        }

        // Check if any products are using this category
        const productsInCategory = await prisma.product.count({
            where: { categoryId: categoryId },
        });

        if (productsInCategory > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category because it is being used by ${productsInCategory} product(s). Please reassign them first.`,
            });
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Category not found.' });
        }
        console.error(`Error deleting category ${req.params.id}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;