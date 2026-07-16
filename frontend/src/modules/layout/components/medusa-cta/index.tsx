import { Text } from "@modules/common/components/ui"

import Enonic from "../../../common/icons/enonic"
import Medusa from "../../../common/icons/medusa"

const MedusaCTA = () => {
  return (
    <Text className="flex gap-x-2 txt-compact-small-plus items-center">
      Powered by
      <a href="https://enonic.com" target="_blank" rel="noreferrer">
        <Enonic fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
      &
      <a href="https://medusajs.com" target="_blank" rel="noreferrer">
        <Medusa fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
    </Text>
  )
}

export default MedusaCTA
