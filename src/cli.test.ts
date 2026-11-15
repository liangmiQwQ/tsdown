import { parseCLI } from 'tsdown/cli'
import { describe, expect, it, vi } from 'vitest'

function parse(...args: string[]): Record<string, any> {
  return parseCLI(['node', 'tsdown', ...args]).options
}

describe('parseCLI', () => {
  it('validates required option values without running a command', () => {
    expect(() => parse('--target')).toThrow('value is missing')
    expect(parse('--target', 'es2022').target).toBe('es2022')
  })

  it('identifies subcommands without executing them', () => {
    expect(parseCLI(['node', 'tsdown', 'create']).command).toBe('create')
    expect(parseCLI(['node', 'tsdown', 'migrate']).command).toBe('migrate')
    expect(parseCLI(['node', 'tsdown', 'src/index.ts']).command).toBe('')
  })

  it('parses help and version without printing or validating build arguments', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    try {
      const parsed = parseCLI(['node', 'tsdown', '--help', '--target'])
      expect(parsed.options.help).toBe(true)
      expect(parsed.command).toBe('')
      expect(parse('--version').version).toBe(true)
      expect(info).not.toHaveBeenCalled()
    } finally {
      info.mockRestore()
    }
  })

  it('treats subcommand names as entries when subcommands are disabled', () => {
    expect(
      parseCLI(['node', 'tsdown', 'create'], { subcommands: false }).args,
    ).toEqual(['create'])
  })

  it('camel-cases nested option keys', () => {
    expect(parse('--deps.never-bundle', 'leftpad').deps).toEqual({
      neverBundle: 'leftpad',
    })
    expect(parse('--deps.neverBundle', 'leftpad').deps).toEqual({
      neverBundle: 'leftpad',
    })
    expect(parse('--deps.dts.never-bundle', 'leftpad').deps).toEqual({
      dts: { neverBundle: 'leftpad' },
    })
  })

  it('keeps user-defined keys verbatim', () => {
    const options = parse(
      '--env.my-var',
      'a',
      '--define.my-flag',
      'b',
      '--alias.my-lib',
      './src/my-lib.ts',
    )
    expect(options.env).toEqual({ 'my-var': 'a' })
    expect(options.define).toEqual({ 'my-flag': 'b' })
    expect(options.alias).toEqual({ 'my-lib': './src/my-lib.ts' })
  })

  it('leaves top-level flags and entries alone', () => {
    const { args, options } = parseCLI([
      'node',
      'tsdown',
      'src/index.ts',
      '--out-dir',
      'lib',
    ])
    expect(args).toEqual(['src/index.ts'])
    expect(options.outDir).toBe('lib')
  })
})
