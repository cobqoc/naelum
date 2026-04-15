/**
 * @supabase/functions-js 대체 shim.
 *
 * 우리 앱은 Supabase Edge Functions를 사용하지 않는다. supabase-js가 constructor에서
 * `new FunctionsClient(...)`를 호출하기 때문에 실제 패키지가 번들에 포함되어 있었다.
 *
 * Surface만 유지하고 실제 로직은 제거.
 */

export class FunctionsClient {
  constructor(_url?: string, _options?: unknown) {}

  setAuth(_token: string | null): void {}

  setHeaders(_headers: Record<string, string>): void {}

  invoke(_functionName: string, _options?: unknown): Promise<{ data: null; error: Error }> {
    return Promise.resolve({
      data: null,
      error: new FunctionsError('Supabase Functions are disabled in this build'),
    })
  }
}

export class FunctionsError extends Error {
  context: unknown
  constructor(message: string, context?: unknown) {
    super(message)
    this.name = 'FunctionsError'
    this.context = context
  }
}

export class FunctionsFetchError extends FunctionsError {
  constructor(context?: unknown) {
    super('Functions fetch error', context)
    this.name = 'FunctionsFetchError'
  }
}

export class FunctionsHttpError extends FunctionsError {
  constructor(context?: unknown) {
    super('Functions HTTP error', context)
    this.name = 'FunctionsHttpError'
  }
}

export class FunctionsRelayError extends FunctionsError {
  constructor(context?: unknown) {
    super('Functions relay error', context)
    this.name = 'FunctionsRelayError'
  }
}

export const FunctionRegion = {
  ANY: 'any',
  APNORTHEAST1: 'ap-northeast-1',
  APNORTHEAST2: 'ap-northeast-2',
  APSOUTH1: 'ap-south-1',
  APSOUTHEAST1: 'ap-southeast-1',
  APSOUTHEAST2: 'ap-southeast-2',
  CACENTRAL1: 'ca-central-1',
  EUCENTRAL1: 'eu-central-1',
  EUWEST1: 'eu-west-1',
  EUWEST2: 'eu-west-2',
  EUWEST3: 'eu-west-3',
  SAEAST1: 'sa-east-1',
  USEAST1: 'us-east-1',
  USWEST1: 'us-west-1',
  USWEST2: 'us-west-2',
} as const
