export const commonQuery = `
query($path:ID!){
  guillotine {
    get(key:$path) {
      displayName
      _id
      type
      dataAsJson
      xAsJson
      ... on com_enonic_app_hmdb_LandingPage {
        data {
          heroImage {
            ... on media_Image {
              mediaUrl
            }
          }
        }
      }
    }
    getSite {
      displayName
      _path
    }
  }
}`;
export function commonVariables(path: string) {
    return {
        path
    }
}
