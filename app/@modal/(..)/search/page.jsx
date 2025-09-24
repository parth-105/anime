import Modal from '@/app/components/Modal'
import SearchPage from '@/app/search/page'

export default function SearchInterceptModal(props){
  return (
    <Modal>
      {/* @ts-expect-error Server Component render inside modal wrapper */}
      <SearchPage {...props} />
    </Modal>
  )
}


