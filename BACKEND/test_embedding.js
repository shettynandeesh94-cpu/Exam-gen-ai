require('dotenv').config();
const { getEmbedding, getEmbeddingsBatch } = require('./services/embeddingService');

async function runTest() {
  try {
    console.log("Testing single embedding...");
    const single = await getEmbedding("Hello world from ExamGen AI!");
    console.log(`Single embedding success! Dimensions: ${single.length}`);

    console.log("\nTesting batch embeddings...");
    const batch = await getEmbeddingsBatch([
      "First document chunk text example.",
      "Second document chunk text example here.",
      "Third chunk text."
    ]);
    console.log(`Batch embedding success! Chunks: ${batch.length}, Dimensions: ${batch[0].length}`);
  } catch (err) {
    console.error("❌ Test failed with error:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

runTest();
