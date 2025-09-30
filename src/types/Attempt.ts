interface Attempt {
  word: string;
  status: 'pending' | 'correct' | 'invalid' | 'rejected' | 'tip';
}

export default Attempt;
