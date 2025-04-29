# CodeDoc.AI - Code Authenticity Analyzer

CodeDoc.AI is a professional code analysis platform that helps you verify the authenticity of code in your GitHub repositories. Using advanced AI technology, it provides detailed insights, authenticity scores, and comprehensive analysis to ensure code quality.

## Features

### 🔍 Authenticity Scoring
- Get precise scores based on comprehensive code analysis
- AI-powered detection of code patterns and characteristics
- Confidence level indicators for analysis results

### 📊 Repository Insights
- Deep analysis of code patterns and quality metrics
- Detailed reasoning for authenticity assessments
- Writing style analysis and code organization evaluation

### 🔒 Secure Analysis
- Safe and private analysis of your repositories
- GitHub OAuth integration for secure access
- Real-time analysis results and caching

## Technology Stack

- **Frontend:** Next.js 14+, React, TypeScript
- **Styling:** Tailwind CSS with custom UI components
- **Authentication:** GitHub OAuth
- **Database:** PostgreSQL with Drizzle ORM
- **Caching:** Redis for performance optimization
- **AI Integration:** Advanced LLM models for code analysis
- **Animation:** Framer Motion for smooth UI transitions

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/authentic-code.git
cd authentic-code
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables
```bash
# Create a .env file with the following variables
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

4. Initialize the database
```bash
bun run db:generate
bun run db:push
```

5. Start the development server
```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
