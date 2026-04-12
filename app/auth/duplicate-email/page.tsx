import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DuplicateEmailContent } from './content'

export default async function DuplicateEmailPage() {
  const cookieStore = await cookies()
  const hint = cookieStore.get('_naelum_dup')

  if (!hint?.value) {
    redirect('/login')
  }

  let email = ''

  try {
    const data = JSON.parse(hint.value)
    email = typeof data.e === 'string' ? data.e : ''
  } catch {
    redirect('/login')
  }

  if (!email) redirect('/login')

  return <DuplicateEmailContent email={email} />
}
