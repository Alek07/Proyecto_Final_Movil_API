const mongoose =  require('mongoose')

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: Number,
        required: true,
    },
    ingredients: [{
        ingredient: {  
            type:String,
            required: true,
            trim: true
        }
    }],
    description: {
        type:String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    images: [{
        image: {
            type: Buffer
        },
    }],
    upvotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

//Set max amount of ingredients upload
recipeSchema.path('ingredients').validate(function (value){
    if(value.length > 6)
        throw new Error("You can't add more than 6 ingredients per recipe")
})

//Set max amount of images upload
recipeSchema.path('images').validate(function (value){
    if(value.length > 3)
        throw new Error("You can't add more than 3 images per recipe")
})

const Recipe = mongoose.model('Recipe', recipeSchema)

module.exports = Recipe