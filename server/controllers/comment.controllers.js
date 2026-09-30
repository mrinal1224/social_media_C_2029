import Comment from "../models/comment.model.js"



const getFilter = (type, id) => {
    return type === 'post' ? { post: id } :
        type === 'reel' ? { reel: id } :
            null

}



export const createComment = async (req, res) => {
    try {


        console.log("controller called")
        const { type, id } = req.params

        const { text } = req.body

        console.log(type, id, text)


        const filter = getFilter(type, id)

        console.log(filter)


        // validations




        // Create the Comment 
        let comment = await Comment.create({
            author: req.user._id,
            text,
            ...filter
        })

        await comment.save()


        res.status(201).json({ message: "comment Created", comment: comment })


    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Errorr', error })
    }
}