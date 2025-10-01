import { motion } from "framer-motion";

export default function Summary({ liked, total, onReswipe }) {
  return (
    <motion.section
      className="summary"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Here are your favourite kitties 🐱</h2>
      <p>
        You liked <strong>{liked.length}</strong> out of <strong>{total}</strong> cats.
      </p>

      {liked.length === 0 && <p>No favourites this round — try again!</p>}

      <div className="grid">
        {liked.map((url, i) => (
          <img key={i} src={url} alt={`Liked cat ${i + 1}`} />
        ))}
      </div>

      <div className="summary-actions">
        <button onClick={onReswipe} className="primary">Swipe Again</button>
      </div>
    </motion.section>
  );
}
