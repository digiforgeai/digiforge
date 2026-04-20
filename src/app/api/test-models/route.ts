export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

    const model = genAI.getGenerativeModel({
      model: 'models/gemini-1.5-flash',
    })

    const result = await model.generateContent("Say hello")
    const text = result.response.text()

    return NextResponse.json({ text })
  } catch (e) {
    console.error('ERROR:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}