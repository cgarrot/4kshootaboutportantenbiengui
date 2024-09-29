#!/data/data/com.termux/files/usr/bin/bash

# Update package lists
echo "Updating package lists..."
pkg update -y

# Install required packages
echo "Installing required packages..."
pkg install -y python3 wget

# Create a directory for the script
echo "Creating directory for the script..."
mkdir -p ~/ricoh_gr3

# Download the test_gr3_image.py script
echo "Downloading test_gr3_image.py..."
wget -O ~/ricoh_gr3/test_gr3_image.py https://raw.githubusercontent.com/cgarrot/4kshootaboutportantenbiengui/refs/heads/main/test/test_gr3_image.py

# Make the script executable
echo "Making the script executable..."
chmod +x ~/ricoh_gr3/test_gr3_image.py

# Create a downloads directory
echo "Creating downloads directory..."
mkdir -p ~/ricoh_gr3/downloads

echo "Installation complete!"
echo "You can now run the script with: python3 ~/ricoh_gr3/test_gr3_image.py"
