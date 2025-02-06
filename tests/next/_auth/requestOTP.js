// todo
module.exports = async (req, res, next) => {
  try {
    const email = req.body.email
    console.log('>>>>>>>>>>>', {email})
    
    res.status(200).json({
      message: 'ok',
      challenge_id: 'wow',
      // session,
    }) 
  } catch (error) {
    next(error)
  }
}