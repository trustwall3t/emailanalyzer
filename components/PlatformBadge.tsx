import Image from 'next/image'

const PlatformBadge = ({platform}:{platform:string}) => {
  return (
    <div>
        <Image src={
            `${platform == "youtu.be" ? "/youtube.svg" : platform == "youtube" ? "/youtube.svg" : platform == "reddit"?"/reddit.svg":"facebook.svg"}`
        }
        width={100}
        height={100}
        alt={platform}
        />
    </div>
  )
}

export default PlatformBadge