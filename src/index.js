require('./db')
const express = require('express')
const userRouter = require('./routers/user')
const recipeRouter = require('./routers/recipe')
const cors = require('cors')

const app = express()
const port = process.env.PORT

app.use(cors())

app.use(express.json())
app.use(userRouter)
app.use(recipeRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})