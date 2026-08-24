import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = "data"
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

def main():
    if not PINECONE_INDEX_NAME:
        raise ValueError("PINECONE_INDEX_NAME is not set in the environment variables.")
        
    print("Loading documents from 'data' directory...")
    
    # Use a custom loader that ignores decoding errors to prevent crashing on invalid characters
    class SafeTextLoader(TextLoader):
        def lazy_load(self):
            with open(self.file_path, encoding="utf-8", errors="ignore") as f:
                text = f.read()
            from langchain_core.documents import Document
            yield Document(page_content=text, metadata={"source": self.file_path})
            
    loader = DirectoryLoader(DATA_DIR, glob="**/*.txt", loader_cls=SafeTextLoader)
    documents = loader.load()

    print(f"Loaded {len(documents)} documents.")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    print("Splitting documents into chunks...")
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    
    print("Initializing HuggingFace Local Embeddings (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Uploading to Pinecone vector store...")
    db = PineconeVectorStore.from_documents(
        chunks, 
        embeddings, 
        index_name=PINECONE_INDEX_NAME
    )
        
    print(f"Successfully uploaded data to Pinecone index: {PINECONE_INDEX_NAME}!")

if __name__ == "__main__":
    main()
