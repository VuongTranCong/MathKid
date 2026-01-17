#!/bin/bash

# MathKid Packaging Script
# Creates a deployable package of the MathKid app

echo "🧮 MathKid Packaging Script"
echo "=========================="

# Create package directory
PACKAGE_DIR="mathkid-package"
echo "Creating package directory: $PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy all necessary files
echo "Copying application files..."
cp index.html "$PACKAGE_DIR/"
cp settings.html "$PACKAGE_DIR/"
cp manifest.json "$PACKAGE_DIR/"
cp sw.js "$PACKAGE_DIR/"
cp README.md "$PACKAGE_DIR/"
cp test-basic.html "$PACKAGE_DIR/"

# Copy directories
echo "Copying directories..."
cp -r css "$PACKAGE_DIR/"
cp -r js "$PACKAGE_DIR/"
cp -r icons "$PACKAGE_DIR/"

# Create deployment instructions
cat > "$PACKAGE_DIR/DEPLOYMENT.md" << 'EOF'
# MathKid Deployment Instructions

## Quick Start Options:

### 1. GitHub Pages (Free HTTPS)
1. Create new GitHub repository
2. Upload all these files to the repository
3. Enable GitHub Pages in repository settings
4. Access at: https://YOUR_USERNAME.github.io/REPO_NAME/

### 2. Netlify (Drag & Drop)
1. Create ZIP of all files
2. Go to netlify.com
3. Drag ZIP to deploy area
4. Get instant HTTPS URL

### 3. Local Testing
```bash
# In this directory:
python -m http.server 8000
# Then visit: http://localhost:8000
```

## iPad Installation:
1. Open your deployed HTTPS URL in iPad Safari
2. Tap Share → "Add to Home Screen"
3. Launch from home screen for app experience

## Requirements:
- HTTPS URL for full PWA features
- Modern browser (Safari 12+)
- JavaScript enabled
EOF

# Create simple deployment index
cat > "$PACKAGE_DIR/deploy.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Deploy MathKid</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .service { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .service a { color: #4CAF50; text-decoration: none; font-weight: bold; }
        .service a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>🧮 MathKid - Deployment Helper</h1>
    <p>Choose a hosting service to deploy your MathKid app:</p>

    <div class="service">
        <h3>GitHub Pages (Free)</h3>
        <p>Upload files to GitHub repository, enable Pages</p>
        <a href="https://pages.github.com/" target="_blank">→ Get Started</a>
    </div>

    <div class="service">
        <h3>Netlify (Easy)</h3>
        <p>Drag & drop ZIP file for instant deployment</p>
        <a href="https://netlify.com/" target="_blank">→ Deploy Now</a>
    </div>

    <div class="service">
        <h3>Vercel (Fast)</h3>
        <p>Connect GitHub for automatic deployments</p>
        <a href="https://vercel.com/" target="_blank">→ Import Project</a>
    </div>

    <hr>
    <p><strong>Local Testing:</strong></p>
    <p>Run <code>python -m http.server 8000</code> in this directory, then visit <code>http://localhost:8000</code></p>

    <p><a href="index.html">→ Test MathKid Locally</a></p>
</body>
</html>
EOF

# Create ZIP for easy deployment
if command -v zip &> /dev/null; then
    echo "Creating ZIP package..."
    cd "$PACKAGE_DIR"
    zip -r "../mathkid-deployment.zip" ./*
    cd ..
    echo "✅ Created: mathkid-deployment.zip"
fi

echo ""
echo "✅ Package created successfully!"
echo "📁 Files are in: $PACKAGE_DIR/"
echo "📦 ZIP package: mathkid-deployment.zip"
echo ""
echo "Next steps:"
echo "1. Choose a deployment method from DEPLOYMENT.md"
echo "2. Upload to your chosen hosting service"
echo "3. Access the HTTPS URL on your iPad"
echo "4. Install as PWA from Safari"
echo ""
echo "🚀 Happy Math Learning!"