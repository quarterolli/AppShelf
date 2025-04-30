(async () => {
  "use strict"

  const view = {
    title: document.getElementById("title"),
    compass: document.getElementById("compass"),
    alert: document.getElementById("alert"),
    message: document.getElementById("message"),
    button: document.getElementById("button"),
    notations: document.getElementById("notations"),
    menu: document.getElementById("menu"),
    homeItem: document.getElementById("i0"),
    map: document.getElementById("map"),
    group: document.getElementById("group"),
    numbers: document.getElementById("numbers"),
    locate: document.getElementById("locate"),
    notify: document.getElementById("notify")
  }
  const coveredBlocks = new Set
  const warnUser = note => {
    view.message.textContent = note
    view.alert.showModal()
  }
  const handleMapTouches = touch => {
    touch.preventDefault()

    const territoryNumber = view.title.dataset.number
    let target = touch.target

    if (territoryNumber === "0" || target.parentElement.id !== "g" + territoryNumber) {
      return
    }

    while (target.tagName !== "path") {
      target = target.previousElementSibling
    }

    let label = target.nextElementSibling.textContent
    let afterText = target.nextElementSibling?.nextElementSibling
    while (afterText?.tagName === "text") {
      label += "/" + afterText.textContent
      afterText = afterText?.nextElementSibling
    }

    if (touch.type === "click") {
      const notFilled = !target.hasAttribute("fill")

      if (notFilled) {
        target.setAttribute("fill", "#333")
        coveredBlocks.add(label)
      } else {
        target.removeAttribute("fill")
        coveredBlocks.delete(label)
      }
    }

    if (touch.type === "contextmenu") {
      if (coveredBlocks.size !== 0) {
        warnUser("Limpe as quadras selecionadas antes de entrar no aplicativo de navegação.")
      } else {
        try {
          const [latitude, longitude] = parameters[target.parentElement.id.replace("g", "i")][label]
          const formattedLongitude = longitude < 100 ? `0${longitude}` : longitude

          navigator.vibrate(200)
          window.location.href = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=-16.6${latitude},-49.2${formattedLongitude}`
        } catch {
          warnUser("As coordenadas da quadra não estão definidas.")
        }
      }
    }
  }

  let parameters
  try {
    parameters = await (await fetch("param.json")).json()
  } catch {
    warnUser("Não foi possível ativar a interação do mapa, verifique sua internet.")
  }

  view.button.addEventListener("click", () => view.alert.close())

  view.notations.addEventListener("click", () => {
    warnUser("Este território possui endereços que não devem ser visitados. Contate o dirigente de campo ou o servo de territórios.")
  })

  document.querySelectorAll("li").forEach(item => item.addEventListener("click", click => {
    const item = click.target
    const { degrees, viewBox } = parameters[item.id]
    const territoryNumber = item.id.slice(1)

    view.title.textContent = item.textContent
    view.title.dataset.number = territoryNumber

    if (territoryNumber !== "0") {
      document.querySelectorAll(`#g${territoryNumber} path`).forEach(block =>
        block.setAttribute("style", "fill-opacity:1")
      )
      view.homeItem.classList.remove("hide")
      view.numbers.classList.add("hide")
    } else {
      view.homeItem.classList.add("hide")
      view.numbers.classList.remove("hide")
    }

    view.map.setAttribute("viewBox", viewBox)
    view.group.setAttribute("transform", `rotate(${degrees})`)
    view.compass.setAttribute("transform", `rotate(${degrees})`)
    view.menu.classList.remove("show")
    view.notations.classList.add("hide")
    
    if (/^(16|19|28)$/.test(territoryNumber)) {
      warnUser("Este território possui endereços que não devem ser visitados. Contate o dirigente de campo ou o servo de territórios.")
      view.notations.classList.remove("hide")
    }
  }))

  view.map.addEventListener("click", handleMapTouches)
  view.map.addEventListener("contextmenu", handleMapTouches)

  view.locate.addEventListener("click", () => {
    const territoryNumber = view.title.dataset.number

    view.menu.classList.add("show")

    coveredBlocks.clear()

    if (territoryNumber !== "0") {
      document.querySelectorAll(`#g${territoryNumber} path`).forEach(block => {
        block.removeAttribute("fill")
        block.removeAttribute("style")
      })
    }
  })

  view.notify.addEventListener("click", async () => {
    if (coveredBlocks.size === 0) {
      warnUser("Nenhum território selecionado para informar.")
      return
    }

    const today = new Date().toLocaleDateString("pt-BR")
    const territoryNumber = view.title.dataset.number
    const blocksCoordination = [...coveredBlocks].sort().reduce((coordination, block, index, array) =>
      index !== array.length - 1
        ? coordination + ", " + block
        : coordination + " e " + block
    )
    const ministryReportToday = {
      text: `Ministério ${today}\nTerritório: ${territoryNumber}\nQuadras: ${blocksCoordination}\nObservações: `
    }

    coveredBlocks.clear()
    document.querySelectorAll(`#g${territoryNumber} path`).forEach(block => block.removeAttribute("fill"))

    try {
      await navigator.share(ministryReportToday)
    } catch {
      try {
        await navigator.clipboard.writeText(ministryReportToday.text)
        warnUser("Copiado para a área de transferência.")
      } catch {
        warnUser("Este dispositivo não permite compartilhar informações com outros aplicativos.")
      }
    }
  })
})();
