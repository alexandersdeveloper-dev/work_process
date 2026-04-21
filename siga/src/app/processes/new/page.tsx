import ProcessForm from '../ProcessForm'

export default function NewProcessPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Novo processo</h1>
          <p className="sub">Preencha as informações para registrar um novo processo</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-b">
          <ProcessForm />
        </div>
      </div>
    </>
  )
}
