import multer from 'multer'


const storage = multer.memoryStorage()


const fileFilter = (req ,file , cb)=>{
    if(file.mimetype.startsWith('video/')){
      cb(null , true)
    }else{
        cb(new Error("Cannot process anything other than Image") , false)
    }
}


const uploadReel = multer({
    storage,
    fileFilter,
    limits :{
    fileSize : 50*1024*1024
    }
})

export default uploadReel


