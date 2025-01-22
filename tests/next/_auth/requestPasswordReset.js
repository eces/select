module.exports = async (req, res, next) => {
  try {
    const email = req.body.email
    const url = req.body.url

    // send email

    res.status(200).json({
      message: 'ok',
    })
  } catch (error) {
    next(error)
  }
}