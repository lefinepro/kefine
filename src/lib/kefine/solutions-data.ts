export interface Solution {
  id: string;
  solver: string;
  title: string;
  description: string;
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
}

export const defaultSolutions: Solution[] = [
  {
    id: '1',
    solver: 'Basic Rust Dev',
    title: 'Simple Hello World without comments',
    description: 'Minimal implementation with just the basics',
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
    diffs: [
      { file: 'src/main.rs', added: 10, removed: 0 }
    ],
    codeLines: [
      { text: '// This is the main function - entry point of every Rust program', type: 'added' },
      { text: 'fn main() {', type: 'added' },
      { text: '    // Print a greeting message to the console', type: 'added' },
      { text: '    // println! is a macro that prints to stdout with a newline', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'unchanged' },
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
    diffs: [
      { file: 'src/main.rs', added: 12, removed: 0 }
    ],
    codeLines: [
      { text: 'use std::io;', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'fn main() {', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: "    println!(\"What's your name?\");", type: 'added' },
      { text: '    let mut name = String::new();', type: 'added' },
      { text: '    io::stdin().read_line(&mut name).expect("Failed to read line");', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '4',
    solver: 'Modern Rust Patterns',
    title: 'Hello World using modern Rust patterns',
    description: 'Uses Result handling and modern syntax',
    diffs: [
      { file: 'src/main.rs', added: 15, removed: 0 }
    ],
    codeLines: [
      { text: 'use std::io::{self, Write};', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'fn main() -> Result<(), Box<dyn std::error::Error>> {', type: 'added' },
      { text: '    println!("Hello, world!");', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    print!("Enter your name: ");', type: 'added' },
      { text: '    io::stdout().flush()?;', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    let mut name = String::new();', type: 'added' },
      { text: '    io::stdin().read_line(&mut name)?;', type: 'added' },
      { text: '', type: 'unchanged' },
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
    diffs: [
      { file: 'main.go', added: 28, removed: 0 },
      { file: 'config.yaml', added: 5, removed: 0 },
      { file: 'go.mod', added: 2, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "log"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
        { text: '    r.RequestURI = ""', type: 'added' },
        { text: '    r.URL.Scheme = "http"', type: 'added' },
        { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    client := &http.Client{}', type: 'added' },
        { text: '    resp, err := client.Do(r)', type: 'added' },
        { text: '    if err != nil {', type: 'added' },
        { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    defer resp.Body.Close()', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    for k, v := range resp.Header {', type: 'added' },
        { text: '        w.Header()[k] = v', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
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
        { text: '', type: 'unchanged' },
        { text: 'proxy:', type: 'added' },
        { text: '  target: "http://localhost:8080"', type: 'added' },
        { text: '  timeout: 30', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'import (', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "log"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'func handleRequest(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    fmt.Printf("Proxying: %s %s\\n", r.Method, r.URL)', type: 'added' },
      { text: '    r.RequestURI = ""', type: 'added' },
      { text: '    r.URL.Scheme = "http"', type: 'added' },
      { text: '    r.URL.Host = "localhost:8080"', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    client := &http.Client{}', type: 'added' },
      { text: '    resp, err := client.Do(r)', type: 'added' },
      { text: '    if err != nil {', type: 'added' },
      { text: '        http.Error(w, err.Error(), 500)', type: 'added' },
      { text: '        return', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    defer resp.Body.Close()', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    for k, v := range resp.Header {', type: 'added' },
      { text: '        w.Header()[k] = v', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    w.WriteHeader(resp.StatusCode)', type: 'added' },
      { text: '    // w.CopyFrom(resp.Body)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'func main() {', type: 'added' },
      { text: '    http.HandleFunc("/", handleRequest)', type: 'added' },
      { text: '    log.Println("Proxy server on :9090")', type: 'added' },
      { text: '    log.Fatal(http.ListenAndServe(":9090", nil))', type: 'added' },
      { text: '}', type: 'added' }
    ]
  },
  {
    id: '6',
    solver: 'Go Proxy Pro',
    title: 'Production-ready Proxy with Logging',
    description: 'Proxy with request/response logging and error handling',
    diffs: [
      { file: 'main.go', added: 48, removed: 0 },
      { file: 'config.go', added: 12, removed: 0 },
      { file: 'logger.go', added: 8, removed: 0 },
      { file: 'go.mod', added: 2, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "net/http/httputil"', type: 'added' },
        { text: '    "net/url"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type ReverseProxy struct {', type: 'added' },
        { text: '    target *url.URL', type: 'added' },
        { text: '    director func(*http.Request)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
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
        { text: '', type: 'unchanged' },
        { text: 'func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    fmt.Printf("[%s] %s -> %s\\n", r.Method, r.URL.Path, rp.target)', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    proxy := &httputil.ReverseProxy{', type: 'added' },
        { text: '        Director: rp.director,', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '    proxy.ServeHTTP(w, r)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
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
        { text: '', type: 'unchanged' },
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
        { text: '', type: 'unchanged' },
        { text: 'func LoadConfig() *Config {', type: 'added' },
        { text: '    return &Config{}', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'logger.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import "log"', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func logRequest(method, path string) {', type: 'added' },
        { text: '    log.Printf("Request: %s %s", method, path)', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func logResponse(status int) {', type: 'added' },
        { text: '    log.Printf("Response: %d", status)', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'import (', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "net/http/httputil"', type: 'added' },
      { text: '    "net/url"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'type ReverseProxy struct {', type: 'added' },
      { text: '    target *url.URL', type: 'added' },
      { text: '    director func(*http.Request)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'unchanged' },
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
      { text: '', type: 'unchanged' },
      { text: 'func (rp *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    fmt.Printf("[%s] %s -> %s\\n", r.Method, r.URL.Path, rp.target)', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    proxy := &httputil.ReverseProxy{', type: 'added' },
      { text: '        Director: rp.director,', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '    proxy.ServeHTTP(w, r)', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'unchanged' },
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
    diffs: [
      { file: 'main.go', added: 65, removed: 0 },
      { file: 'ratelimit.go', added: 20, removed: 0 },
      { file: 'cache.go', added: 15, removed: 0 },
      { file: 'metrics.go', added: 10, removed: 0 },
      { file: 'go.mod', added: 2, removed: 0 }
    ],
    fileCodeLines: {
      'main.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import (', type: 'added' },
        { text: '    "context"', type: 'added' },
        { text: '    "fmt"', type: 'added' },
        { text: '    "net/http"', type: 'added' },
        { text: '    "time"', type: 'added' },
        { text: ')', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type EnterpriseProxy struct {', type: 'added' },
        { text: '    rateLimiter *RateLimiter', type: 'added' },
        { text: '    cache *Cache', type: 'added' },
        { text: '    metrics *Metrics', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func NewEnterpriseProxy() *EnterpriseProxy {', type: 'added' },
        { text: '    return &EnterpriseProxy{', type: 'added' },
        { text: '        rateLimiter: NewRateLimiter(100, time.Second)', type: 'added' },
        { text: '        cache: NewCache(time.Hour)', type: 'added' },
        { text: '        metrics: NewMetrics(),', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func (ep *EnterpriseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
        { text: '    ctx := context.Background()', type: 'added' },
        { text: '    if !ep.rateLimiter.Allow(ctx) {', type: 'added' },
        { text: '        http.Error(w, "Rate limit exceeded", 429)', type: 'added' },
        { text: '        return', type: 'added' },
        { text: '    }', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    ep.metrics.Increment("requests")', type: 'added' },
        { text: '    w.WriteHeader(http.StatusOK)', type: 'added' },
        { text: '    fmt.Fprintf(w, "Enterprise Proxy")', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'ratelimit.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import "context"', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type RateLimiter struct {', type: 'added' },
        { text: '    maxRequests int', type: 'added' },
        { text: '    window time.Duration', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func NewRateLimiter(max int, window time.Duration) *RateLimiter {', type: 'added' },
        { text: '    return &RateLimiter{maxRequests: max, window: window}', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func (rl *RateLimiter) Allow(ctx context.Context) bool {', type: 'added' },
        { text: '    return true', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'cache.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'import "time"', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type Cache struct {', type: 'added' },
        { text: '    ttl time.Duration', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func NewCache(ttl time.Duration) *Cache {', type: 'added' },
        { text: '    return &Cache{ttl: ttl}', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'metrics.go': [
        { text: 'package main', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'type Metrics struct {', type: 'added' },
        { text: '    counters map[string]int64', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func NewMetrics() *Metrics {', type: 'added' },
        { text: '    return &Metrics{counters: make(map[string]int64)}', type: 'added' },
        { text: '}', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'func (m *Metrics) Increment(key string) {', type: 'added' },
        { text: '    m.counters[key]++', type: 'added' },
        { text: '}', type: 'added' }
      ],
      'go.mod': [
        { text: 'module github.com/example/proxy', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'go 1.21', type: 'added' }
      ]
    },
    codeLines: [
      { text: 'package main', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'import (', type: 'added' },
      { text: '    "context"', type: 'added' },
      { text: '    "fmt"', type: 'added' },
      { text: '    "net/http"', type: 'added' },
      { text: '    "time"', type: 'added' },
      { text: ')', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'type EnterpriseProxy struct {', type: 'added' },
      { text: '    rateLimiter *RateLimiter', type: 'added' },
      { text: '    cache *Cache', type: 'added' },
      { text: '    metrics *Metrics', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'func NewEnterpriseProxy() *EnterpriseProxy {', type: 'added' },
      { text: '    return &EnterpriseProxy{', type: 'added' },
      { text: '        rateLimiter: NewRateLimiter(100, time.Second)', type: 'added' },
      { text: '        cache: NewCache(time.Hour)', type: 'added' },
      { text: '        metrics: NewMetrics(),', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '}', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: 'func (ep *EnterpriseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {', type: 'added' },
      { text: '    ctx := context.Background()', type: 'added' },
      { text: '    if !ep.rateLimiter.Allow(ctx) {', type: 'added' },
      { text: '        http.Error(w, "Rate limit exceeded", 429)', type: 'added' },
      { text: '        return', type: 'added' },
      { text: '    }', type: 'added' },
      { text: '', type: 'unchanged' },
      { text: '    ep.metrics.Increment("requests")', type: 'added' },
      { text: '    w.WriteHeader(http.StatusOK)', type: 'added' },
      { text: '    fmt.Fprintf(w, "Enterprise Proxy")', type: 'added' },
      { text: '}', type: 'added' }
    ]
  }
];