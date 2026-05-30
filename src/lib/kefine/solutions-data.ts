export interface QuickTest {
  /** Short, runnable invocation shown monospace, e.g. `POST /` or `cargo run`. */
  command: string;
  /** What the test verifies, e.g. `Forwards a request`. */
  title: string;
  /** Expected outcome, e.g. `200 · proxy ready`. */
  expected: string;
  /** Whether running the test succeeds. Defaults to `true` when omitted. */
  passes?: boolean;
  /**
   * Actual outcome reported after running the test. Defaults to `expected`
   * when the test passes; set it to show a mismatch when `passes` is `false`.
   */
  actual?: string;
}

export interface Solution {
  id: string;
  solver: string;
  title: string;
  description: string;
  project?: string;
  slug?: string;
  /**
   * A single quick test the user can run to validate the solution right away,
   * surfaced on the solution card instead of the list of changed files.
   */
  quickTest?: QuickTest;
  codeLines: Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>;
  fileCodeLines?: Record<string, Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>>;
  diffs: Array<{
    file: string;
    added: number;
    removed: number;
  }>;
  rated?: boolean;
  correctedCodeLines?: Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>;
  correctedFileCodeLines?: Record<string, Array<{
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  }>>;
  correctedDiffs?: Array<{
    file: string;
    added: number;
    removed: number;
  }>;
}

export interface SolutionMetric {
  solverId: string;
  solver: string;
  executionTimeSec: number;
  priceUsd: number;
  successRate: number;
}

export const defaultMetrics: SolutionMetric[] = [
  { solverId: '1', solver: 'Basic Rust Dev', executionTimeSec: 0.7, priceUsd: 0.04, successRate: 78 },
  { solverId: '2', solver: 'Commented Rust Expert', executionTimeSec: 1.1, priceUsd: 0.09, successRate: 84 },
  { solverId: '3', solver: 'Interactive Rust', executionTimeSec: 1.6, priceUsd: 0.14, successRate: 87 },
  { solverId: '4', solver: 'Modern Rust Patterns', executionTimeSec: 1.9, priceUsd: 0.18, successRate: 90 },
  { solverId: '5', solver: 'Go Proxy Basic', executionTimeSec: 1.2, priceUsd: 0.08, successRate: 82 },
  { solverId: '6', solver: 'Go Proxy Pro', executionTimeSec: 2.4, priceUsd: 0.21, successRate: 91 },
  { solverId: '7', solver: 'Go Proxy Enterprise', executionTimeSec: 3.8, priceUsd: 0.59, successRate: 97 }
];

export const defaultSolutions: Solution[] = [
  {
    id: '1',
    solver: 'Basic Rust Dev',
    title: 'Simple Hello World without comments',
    description: 'Minimal implementation with just the basics',
    quickTest: {
      command: 'cargo run',
      title: 'Prints the greeting',
      expected: 'Hello, world!'
    },
    diffs: [
      { file: 'src/main.rs', added: 3, removed: 0 }
    ],
    codeLines: [
      { text: 'fn main() {', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '2',
    solver: 'Commented Rust Expert',
    title: 'Hello World with detailed comments',
    description: 'Educational version with explanations for each line',
    quickTest: {
      command: 'cargo run',
      title: 'Prints the greeting',
      expected: 'Hello, world!'
    },
    diffs: [
      { file: 'src/main.rs', added: 9, removed: 0 }
    ],
    codeLines: [
      { text: '// This is the main function - entry point of every Rust program', type: 'added' },
      { text: 'fn main() {', type: 'added' },
      { text: '    // Print a greeting message to the console', type: 'added' },
      { text: '    // println! is a macro that prints to stdout with a newline', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'added' },
      { text: '    // The program will exit here', type: 'added' },
      { text: '    // Rust automatically returns () (unit type) from functions', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '3',
    solver: 'Interactive Rust',
    title: 'Interactive Hello World with user input',
    description: 'Reads user input and responds accordingly',
    quickTest: {
      command: 'echo "Ada" | cargo run',
      title: 'Greets the entered name',
      expected: 'Hello, Ada!'
    },
    diffs: [
      { file: 'src/main.rs', added: 11, removed: 0 }
    ],
    codeLines: [
      { text: 'use std::io;', type: 'added' },
      { text: '', type: 'added' },
      { text: 'fn main() {', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'added' },
      { text: "    println!(\"What's your name?\");", type: 'added' },
      { text: '    let mut name = String::new();', type: 'added' },
      { text: '    io::stdin().read_line(&mut name).expect("Failed to read line");', type: 'added' },
      { text: '', type: 'added' },
      { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '4',
    solver: 'Modern Rust Patterns',
    title: 'Hello World using modern Rust patterns',
    description: 'Uses Result handling and modern syntax',
    quickTest: {
      command: 'echo "Ada" | cargo run',
      title: 'Greets the entered name',
      expected: 'Hello, Ada!'
    },
    diffs: [
      { file: 'src/main.rs', added: 14, removed: 0 }
    ],
    codeLines: [
      { text: 'use std::io::{self, Write};', type: 'added' },
      { text: '', type: 'added' },
      { text: 'fn main() -> Result<(), Box<dyn std::error::Error>> {', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'added' },
      { text: '    print!("Enter your name: ");', type: 'added' },
      { text: '    io::stdout().flush()?;', type: 'added' },
      { text: '', type: 'added' },
      { text: '    let mut name = String::new();', type: 'added' },
      { text: '    io::stdin().read_line(&mut name)?;', type: 'added' },
      { text: '', type: 'added' },
      { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
      { text: '    Ok(())', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '5',
    solver: 'Go Proxy Basic',
    title: 'Simple HTTP Proxy',
    description: 'Minimal HTTP proxy with forward functionality',
    project: 'kefine/go-proxy',
    slug: 'feat/basic-forward',
    quickTest: {
      command: 'POST /',
      title: 'Forwards a request',
      expected: '200 · proxy ready'
    },
    diffs: [
      { file: 'main.go', added: 33, removed: 0 },
      { file: 'config.yaml', added: 7, removed: 0 },
      { file: 'go.mod', added: 3, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "log"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
        { text: '    r.RequestURI = ""', type: 'added' },
        { text: '    r.URL.Scheme = "http"', type: 'added' },
        { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
        { text: '', type: 'added' },
        { text: '    client := &http.Client{}', type: 'added' },
        { text: '    resp, err := client.Do(r)', type: 'added' },
        { text: '    if err != nil {', type: 'added' },
        { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    defer resp.Body.Close()', type: 'added' },
        { text: '', type: 'added' },
        { text: '    for k, v := range resp.Header {', type: 'added' },
        { text: '        w.Header()[k] = v', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func main() {', type: 'added' },
        { text: '    http.HandleFunc("/", handleRequest)', type: 'added' },
        { text: '    log.Println("Proxy server on :9090")', type: 'added' },
        { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'config.yaml': [
        { text: 'server:', type: 'added' },
        { text: '  port: 9090', type: 'added' },
        { text: '  host: "0.0.0.0"', type: 'added' },
        { text: '', type: 'added' },
        { text: 'proxy:', type: 'added' },
        { text: '  target: "http://localhost:8080"', type: 'added' },
        { text: '  timeout: 30', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'added' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'added' },
      { text: 'import (', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "log"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
      { text: '    r.RequestURI = ""', type: 'added' },
      { text: '    r.URL.Scheme = "http"', type: 'added' },
      { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
      { text: '', type: 'added' },
      { text: '    client := &http.Client{}', type: 'added' },
      { text: '    resp, err := client.Do(r)', type: 'added' },
      { text: '    if err != nil {', type: 'added' },
      { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
      { text: '        return', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    defer resp.Body.Close()', type: 'added' },
      { text: '', type: 'added' },
      { text: '    for k, v := range resp.Header {', type: 'added' },
      { text: '        w.Header()[k] = v', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
      { text: '    // w.CopyFrom(resp.Body)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func main() {', type: 'added' },
      { text: '    http.HandleFunc("/", handleRequest)', type: 'added' },
      { text: '    log.Println("Proxy server on :9090")', type: 'added' },
      { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'added' },
      { text: '}', type: 'added' }
    ],
    correctedDiffs: [
      { file: 'main.go', added: 4, removed: 1 },
      { file: 'config.yaml', added: 7, removed: 0 },
      { file: 'go.mod', added: 3, removed: 0 }
    ],
    correctedFileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'unchanged' },
        { text: '    "fmt"', type: 'unchanged' },
        { text: '    "net/http"', type: 'unchanged' },
        { text: '    "log"', type: 'unchanged' },
        { text: ')', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'unchanged' },
        { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'removed' },
        { text: '    for i := 0; i < 10; i++ {', type: 'added' },
        { text: '        fmt.Printf("[%d] Proxying: %s %s\\n", i+1, r.Method, r.URL)', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    r.RequestURI = ""', type: 'unchanged' },
        { text: '    r.URL.Scheme = "http"', type: 'unchanged' },
        { text: '    r.URL.Host = "localhost:8080"', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: '    client := &http.Client{}', type: 'unchanged' },
        { text: '    resp, err := client.Do(r)', type: 'unchanged' },
        { text: '    if err != nil {', type: 'unchanged' },
        { text: '        http.Error(w, err.Error(), 500)', type: 'unchanged' },
        { text: '        return', type: 'unchanged' },
        { text: '    }', type: 'unchanged' },
        { text: '    defer resp.Body.Close()', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: '    for k, v := range resp.Header {', type: 'unchanged' },
        { text: '        w.Header()[k] = v', type: 'unchanged' },
        { text: '    }', type: 'unchanged' },
        { text: '    w.WriteHeader(resp.StatusCode)', type: 'unchanged' },
        { text: '}', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: 'func main() {', type: 'unchanged' },
        { text: '    http.HandleFunc("/", handleRequest)', type: 'unchanged' },
        { text: '    log.Println("Proxy server on :9090")', type: 'unchanged' },
        { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'unchanged' },
        { text: '}', type: 'unchanged' }
      ],
      'config.yaml': [
        { text: 'server:', type: 'unchanged' },
        { text: '  port: 9090', type: 'unchanged' },
        { text: '  host: "0.0.0.0"', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: 'proxy:', type: 'unchanged' },
        { text: '  target: "http://localhost:8080"', type: 'unchanged' },
        { text: '  timeout: 30', type: 'unchanged' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'unchanged' },
        { text: '', type: 'unchanged' },
        { text: 'go 1.21', type: 'unchanged' }
      ]
    },
    correctedCodeLines: [
      { text: 'package main', type: 'unchanged' },
      { text: '', type: 'unchanged' },
      { text: 'import (', type: 'unchanged' },
      { text: '    "fmt"', type: 'unchanged' },
      { text: '    "net/http"', type: 'unchanged' },
      { text: '    "log"', type: 'unchanged' },
      { text: ')', type: 'unchanged' },
      { text: '', type: 'unchanged' },
      { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'unchanged' },
      { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'removed' },
      { text: '    for i := 0; i < 10; i++ {', type: 'added' },
      { text: '        fmt.Printf("[%d] Proxying: %s %s\\n", i+1, r.Method, r.URL)', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    r.RequestURI = ""', type: 'unchanged' },
      { text: '    r.URL.Scheme = "http"', type: 'unchanged' },
      { text: '    r.URL.Host = "localhost:8080"', type: 'unchanged' },
      { text: '', type: 'unchanged' },
      { text: '    client := &http.Client{}', type: 'unchanged' },
      { text: '    resp, err := client.Do(r)', type: 'unchanged' },
      { text: '    if err != nil {', type: 'unchanged' },
      { text: '        http.Error(w, err.Error(), 500)', type: 'unchanged' },
      { text: '        return', type: 'unchanged' },
      { text: '    }', type: 'unchanged' },
      { text: '    defer resp.Body.Close()', type: 'unchanged' },
      { text: '', type: 'unchanged' },
      { text: '    for k, v := range resp.Header {', type: 'unchanged' },
      { text: '        w.Header()[k] = v', type: 'unchanged' },
      { text: '    }', type: 'unchanged' },
      { text: '    w.WriteHeader(resp.StatusCode)', type: 'unchanged' },
      { text: '    // w.CopyFrom(resp.Body)', type: 'unchanged' },
      { text: '}', type: 'unchanged' },
      { text: '', type: 'unchanged' },
      { text: 'func main() {', type: 'unchanged' },
      { text: '    http.HandleFunc("/", handleRequest)', type: 'unchanged' },
      { text: '    log.Println("Proxy server on :9090")', type: 'unchanged' },
      { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'unchanged' },
      { text: '}', type: 'unchanged' }
    ]
  },
  {
    id: '6',
    solver: 'Go Proxy Pro',
    title: 'Production-ready Proxy with Logging',
    description: 'Proxy with request/response logging and error handling',
    project: 'kefine/go-proxy',
    slug: 'feat/structured-logging',
    quickTest: {
      command: 'GET /health',
      title: 'Reports healthy status',
      expected: '200 · status ok'
    },
    diffs: [
      { file: 'main.go', added: 43, removed: 0 },
      { file: 'config.go', added: 16, removed: 0 },
      { file: 'logger.go', added: 11, removed: 0 },
      { file: 'go.mod', added: 3, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "net/http/httputil"', type: 'added' },
        { text: '    "net/url"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type ReverseProxy struct {', type: 'added' },
        { text: '    target *url.URL', type: 'added' },
        { text: '    director func(*http.Request)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func NewReverseProxy(target string) *ReverseProxy {', type: 'added' },
        { text: '    targetURL, _ := url.Parse(target)', type: 'added' },
        { text: '    return &ReverseProxy{', type: 'added' },
        { text: '        target: targetURL,', type: 'added' },
        { text: '        director: func(req *http.Request) {', type: 'added' },
        { text: '            req.URL.Scheme = targetURL.Scheme', type: 'added' },
        { text: '            req.URL.Host = targetURL.Host', type: 'added' },
        { text: '            req.Header.Set("X-Forwarded-Host", req.Host)', type: 'added' },
        { text: '            req.Header.Set("X-Real-IP", req.RemoteAddr)', type: 'added' },
        { text: '        },', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("[%s] %s -> %s\\n", r.Method, r.URL.Path, rp.target)', type: 'added' },
        { text: '', type: 'added' },
        { text: '    proxy := &httputil.ReverseProxy{', type: 'added' },
        { text: '        Director: rp.director,', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    proxy.ServeHTTP(w, r)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func main() {', type: 'added' },
        { text: '    proxy := NewReverseProxy("http://localhost:8080")', type: 'added' },
        { text: '    http.Handle("/", proxy)', type: 'added' },
        { text: '    fmt.Println("Reverse proxy listening on :9090")', type: 'added' },
        { text: '    fmt.Println("Forwarding to http://localhost:8080")', type: 'added' },
        { text: '    http.ListenAndServe(":9090", nil)', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'config.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type Config struct {', type: 'added' },
        { text: '    Server struct {', type: 'added' },
        { text: '        Port string', type: 'added' },
        { text: '        Host string', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    Proxy struct {', type: 'added' },
        { text: '        Target   string', type: 'added' },
        { text: '        Timeout  int', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func LoadConfig() *Config {', type: 'added' },
        { text: '    return &Config{}', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'logger.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import "log"', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func logRequest(method, path string) {', type: 'added' },
        { text: '    log.Printf("Request: %s %s", method, path)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func logResponse(status int) {', type: 'added' },
        { text: '    log.Printf("Response: %d", status)', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'added' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'added' },
      { text: 'import (', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "net/http/httputil"', type: 'added' },
      { text: '    "net/url"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'added' },
      { text: 'type ReverseProxy struct {', type: 'added' },
      { text: '    target *url.URL', type: 'added' },
      { text: '    director func(*http.Request)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func NewReverseProxy(target string) *ReverseProxy {', type: 'added' },
      { text: '    targetURL, _ := url.Parse(target)', type: 'added' },
      { text: '    return &ReverseProxy{', type: 'added' },
      { text: '        target: targetURL,', type: 'added' },
      { text: '        director: func(req *http.Request) {', type: 'added' },
      { text: '            req.URL.Scheme = targetURL.Scheme', type: 'added' },
      { text: '            req.URL.Host = targetURL.Host', type: 'added' },
      { text: '            req.Header.Set("X-Forwarded-Host", req.Host)', type: 'added' },
      { text: '            req.Header.Set("X-Real-IP", req.RemoteAddr)', type: 'added' },
      { text: '        },', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    fmt.Printf("[%s] %s -> %s\\n", r.Method, r.URL.Path, rp.target)', type: 'added' },
      { text: '', type: 'added' },
      { text: '    proxy := &httputil.ReverseProxy{', type: 'added' },
      { text: '        Director: rp.director,', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    proxy.ServeHTTP(w, r)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func main() {', type: 'added' },
      { text: '    proxy := NewReverseProxy("http://localhost:8080")', type: 'added' },
      { text: '    http.Handle("/", proxy)', type: 'added' },
      { text: '    fmt.Println("Reverse proxy listening on :9090")', type: 'added' },
      { text: '    fmt.Println("Forwarding to http://localhost:8080")', type: 'added' },
      { text: '    http.ListenAndServe(":9090", nil)', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '7',
    solver: 'Go Proxy Enterprise',
    title: 'Advanced Proxy with Rate Limiting',
    description: 'Enterprise features: rate limiting, caching, metrics',
    project: 'kefine/go-proxy',
    slug: 'feat/auth-rate-metrics',
    quickTest: {
      command: 'POST /proxy',
      title: 'Forwards under the rate limit',
      expected: '200 · forwarded'
    },
    diffs: [
      { file: 'main.go', added: 34, removed: 0 },
      { file: 'ratelimit.go', added: 16, removed: 0 },
      { file: 'cache.go', added: 11, removed: 0 },
      { file: 'metrics.go', added: 13, removed: 0 },
      { file: 'go.mod', added: 3, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import (', type: 'added' },
        { text: '    "context"', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "time"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type EnterpriseProxy struct {', type: 'added' },
        { text: '    rateLimiter *RateLimiter', type: 'added' },
        { text: '    cache *Cache', type: 'added' },
        { text: '    metrics *Metrics', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func NewEnterpriseProxy() *EnterpriseProxy {', type: 'added' },
        { text: '    return &EnterpriseProxy{', type: 'added' },
        { text: '        rateLimiter: NewRateLimiter(100, time.Second)', type: 'added' },
        { text: '        cache: NewCache(time.Hour)', type: 'added' },
        { text: '        metrics: NewMetrics(),', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func (ep *EnterpriseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    ctx := context.Background()', type: 'added' },
        { text: '    if !ep.rateLimiter.Allow(ctx) {', type: 'added' },
        { text: '        http.Error(w, "Rate limit exceeded", 429)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '', type: 'added' },
        { text: '    ep.metrics.Increment("requests")', type: 'added' },
        { text: '    w.WriteHeader(http.StatusOK)', type: 'added' },
        { text: '    fmt.Fprintf(w, "Enterprise Proxy")', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'ratelimit.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import "context"', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type RateLimiter struct {', type: 'added' },
        { text: '    maxRequests int', type: 'added' },
        { text: '    window time.Duration', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func NewRateLimiter(max int, window time.Duration) *RateLimiter {', type: 'added' },
        { text: '    return &RateLimiter{maxRequests: max, window: window}', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func (rl *RateLimiter) Allow(ctx context.Context) bool {', type: 'added' },
        { text: '    return true', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'cache.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'import "time"', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type Cache struct {', type: 'added' },
        { text: '    ttl time.Duration', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func NewCache(ttl time.Duration) *Cache {', type: 'added' },
        { text: '    return &Cache{ttl: ttl}', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'metrics.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'added' },
        { text: 'type Metrics struct {', type: 'added' },
        { text: '    counters map[string]int64', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func NewMetrics() *Metrics {', type: 'added' },
        { text: '    return &Metrics{counters: make(map[string]int64)}', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'added' },
        { text: 'func (m *Metrics) Increment(key string) {', type: 'added' },
        { text: '    m.counters[key]++', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'added' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'added' },
      { text: 'import (', type: 'added' },
      { text: '    "context"', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "time"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'added' },
      { text: 'type EnterpriseProxy struct {', type: 'added' },
      { text: '    rateLimiter *RateLimiter', type: 'added' },
      { text: '    cache *Cache', type: 'added' },
      { text: '    metrics *Metrics', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func NewEnterpriseProxy() *EnterpriseProxy {', type: 'added' },
      { text: '    return &EnterpriseProxy{', type: 'added' },
      { text: '        rateLimiter: NewRateLimiter(100, time.Second)', type: 'added' },
      { text: '        cache: NewCache(time.Hour)', type: 'added' },
      { text: '        metrics: NewMetrics(),', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'added' },
      { text: 'func (ep *EnterpriseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    ctx := context.Background()', type: 'added' },
      { text: '    if !ep.rateLimiter.Allow(ctx) {', type: 'added' },
      { text: '        http.Error(w, "Rate limit exceeded", 429)', type: 'added' },
      { text: '        return', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '', type: 'added' },
      { text: '    ep.metrics.Increment("requests")', type: 'added' },
      { text: '    w.WriteHeader(http.StatusOK)', type: 'added' },
      { text: '    fmt.Fprintf(w, "Enterprise Proxy")', type: 'added' },
      { text: '}', type: 'added' }
    ]
  }
];
