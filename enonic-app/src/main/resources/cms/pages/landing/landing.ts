import { render } from "/lib/thymeleaf"
import { getContent } from "/lib/xp/portal"

export function GET() {
  const content = getContent()
  return render(resolve("landing.html"), { content })
}
