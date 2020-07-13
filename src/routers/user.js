const express = require('express')
const auth = require('../middleware/auth')
const router = new express.Router()
const upload = require('../middleware/media')
const sharp = require('sharp')
const User = require('../models/user')
const Recipe = require('../models/recipe')

//Create User
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        res.status(201).send(user)
    } catch (e) {
        console.log(e)
        res.status(404).send()
    }
})

//Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

//Logout
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        
        await req.user.save()

        res.send()
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Logout all sesions (clean all tokens)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        
        await req.user.save()

        res.send()
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Get User info
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//Get User recipes (created by)
router.get('/users/me/recipes', auth, async(req, res) => {
    try {
        const recipes = await Recipe.find({author: req.user._id })
        if(!recipes)
            return res.status(404),send()
        res.send(recipes)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Get User favorites
router.get('/users/me/favorites', auth, async(req, res) => {
    try {
        var recipes_id = req.user.favorites.map(favorite => favorite.recipe)
        const recipes = await Recipe.find().where('_id').in(recipes_id).exec()
        res.send(recipes)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Update User
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

//Delete User
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

//Upload Profile Picture
router.post('/users/me/avatar', auth, upload.single('avatar'),  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

//Get User Profile Picture
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar)
            throw new Error()

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

//Delete User Profile Picture
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

module.exports = router