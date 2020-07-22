const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()
const upload = require('../middleware/media')
const sharp = require('sharp')
const Recipe = require('../models/recipe')
const User = require('../models/user')

//Create recipe
router.post('/recipes', auth, async (req, res) => {
    try {
        const recipe = new Recipe(req.body)

        await recipe.save()
        res.status(201).send(recipe)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

//Get all recipes
//search: name
//filter: category
//sortby: upvotes, release
router.get('/recipes', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.category)
        match.category = req.query.category
    
    if(req.query.sortby) {
        var option = req.query.sortby.split(':')
        sort[option[0]] = option[1]
    }

    try {
        const recipes = await Recipe.find(match).sort(sort)
        res.send(recipes)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }

})

//Get one recipe
router.get('/recipe/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findOne({_id: req.params.id})
        if(!recipe)
            return res.status(404).send()
        res.send(recipe)
    } catch (e) {
        console.log(e)
        res.status(500).send()       
    }
})

//Add Recipe to User favorites
router.patch('/recipes/:id/add', auth, async (req, res) => {
    try {
        var newFavorite = {"recipe": req.params.id}
        var recipe = await Recipe.findOne({ _id: req.params.id })
        if(!req.user.favorites.length) {
            req.user.favorites.push(newFavorite)
        }
        else {
            var recipes_id = req.user.favorites.map(favorite => favorite.recipe.toString())
            const isFavorite = recipes_id.every(id => id != req.params.id)
            if(!isFavorite)
                return res.status(400).send({ error: 'recipe is already favorite' })

            req.user.favorites.push(newFavorite)
            recipe["upvotes"] += 1
        }
        await req.user.save()
        await recipe.save()
        res.send(req.user)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Remove Recipe from User favorites
router.patch('/recipes/:id/remove', auth, async (req, res) => {
    try {
        var recipe = await Recipe.findOne({ _id: req.params.id })
        var favorites = req.user.favorites.filter( favorite => favorite.recipe != req.params.id)
        req.user.favorites = favorites
        recipe["upvotes"] -= 1
        await req.user.save()
        await recipe.save()
        res.send(req.user)
    } catch (e) {
        console.log(e)
        res.status(500).send() 
    }
})

//Update Recipe
router.patch('/recipes/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates= ['name', 'category', 'ingredients', 'description', 'upvotes']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation)
        return res.status(400).send({ error: 'Invalid update!' })
    
    try {
        const recipe = await Recipe.findOne({ _id: req.params.id, author: req.user._id })
        updates.forEach((update) => recipe[update] = req.body[update])
        await recipe.save()

        if (!recipe)
            return res.status(404),send()
        res.send(recipe)
    } catch (e) {
        console.log(e)
        res.status(400).send(error)
    }
})

//Delete Recipe
router.delete('/recipes/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, author: req.user._id })
        if(!recipe)
            return res.status(404).send()
        res.send(recipe)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Upload Recipe Image
router.post('/recipes/:id/images', auth, upload.single('image'),  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    const recipe  = await Recipe.findOne({_id: req.params.id})
    recipe.images.push({"image": buffer})
    await recipe.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

//Get User Recipe Image
router.get('/recipes/:id/images/:img', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id)

        if(!recipe || !recipe.images)
            throw new Error()

        const image = recipe.images.filter(image => image.id === req.params.img)
        res.set('Content-Type', 'image/png')
        res.send(image[0].image)
    } catch (e) {
        console.log(e)
        res.status(404).send()
    }
})

//Delete Recipe Image
router.delete('/recipes/:id/images/:img', auth, async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
    recipe.images = recipe.images.filter(image => image.id !== req.params.img)
    await recipe.save()
    res.send()
})

module.exports = router
