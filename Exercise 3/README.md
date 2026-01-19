# Exercise 3: Text-to-Speech with Replicate

This exercise demonstrates how to use the Replicate API to generate high-quality speech from text using the **Coqui XTTS-v2** model.

## Features

- **Multi-voice Conversation**: A dialogue between two characters (Alex and Sam).
- **Emotional Range**: Demonstrates various emotional tones through dialogue (excited, nervous, grateful, etc.).
- **Automated Generation**: Script automatically generates and saves each line as a separate `.wav` file.

## Conversation Audio

Listen to the generated conversation below:

### 1. Alex (Excited)

<audio src="./assets/01_alex_excited.wav" controls></audio>

### 2. Sam (Surprised/Happy)

<audio src="./assets/02_sam_surprised.wav" controls></audio>

### 3. Alex (Nervous)

<audio src="./assets/03_alex_nervous.wav" controls></audio>

### 4. Sam (Reassuring)

<audio src="./assets/04_sam_reassuring.wav" controls></audio>

### 5. Alex (Grateful)

<audio src="./assets/05_alex_grateful.wav" controls></audio>

### 6. Sam (Cheerful)

<audio src="./assets/06_sam_cheerful.wav" controls></audio>

### 7. Alex (Happy)

<audio src="./assets/07_alex_happy.wav" controls></audio>

### 8. Sam (Laughing)

<audio src="./assets/08_sam_laughing.wav" controls></audio>

## How to Run

1. Ensure you have your `REPLICATE_API_TOKEN` in the `.env` file.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the script:
   ```bash
   npm start
   ```
