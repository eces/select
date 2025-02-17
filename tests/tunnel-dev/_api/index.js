const router = useRouter()

router.get('/hello', async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'ok',
    })
  } catch (error) {
    next(err)
  }
})

module.exports = router
// export default router