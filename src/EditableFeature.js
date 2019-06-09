const ModulekitForm = require('modulekit-form')

const getLayerForm = require('./getLayerForm')
const Feature = require('./Feature')
const objectCopy = require('./objectCopy')

class EditableFeature extends Feature {
  add () {
    this.leafletLayer.on('click', e => this.edit())
    if (this.leafletMarker) {
      this.leafletMarker.on('click', e => this.edit())
    }

    super.add()
  }

  edit () {
    this.editor.disableCurrentEditing()

    this.leafletLayer.editing.enable()
    this.editor.currentEdit = this

    this.editor.sidebarDom.innerHTML = ''

    let form = document.createElement('form')
    this.editor.sidebarDom.appendChild(form)
    form.onsubmit = () => {
      this.disableEdit()
      this.editor.edit()
      return false
    }

    let formDef = {
      layer: {
        type: 'select',
        name: 'Layer',
        values: this.editor.allLayerNames(),
      }
    }

    objectCopy(getLayerForm(this.leafletLayer, this.parent.getFullStyle(this.leafletLayer)), formDef)

    let f = new ModulekitForm(
      'data',
      formDef, {
        change_on_input: true
      }
    )

    f.show(form)

    let input = document.createElement('input')
    input.type = 'submit'
    input.value = 'Ok'
    form.appendChild(input)

    f.set_data({
      layer: this.parent.path(),
      properties: this.properties,
      style: this.style
    })

    f.onchange = () => {
      let newData = f.get_data()

      if (newData.layer !== this.parent.path()) {
        this.parent.items.splice(this.parent.items.indexOf(this), 1)
        let layer = this.editor.allLayers()[newData.layer]
        if (layer) {
          this.parent = layer
          layer.items.push(this)
        }

        this.editor._currentLayer = layer
      }

      for (let k in newData.properties) {
        this.properties[k] = newData.properties[k]
      }
      for (let k in newData.style) {
        if (newData.style[k] === null) {
          delete this.style[k]
        } else {
          this.style[k] = newData.style[k]
        }
      }

      this.refresh()
    }

    let actions = document.createElement('div')
    actions.className = 'actions'
    form.appendChild(actions)

    let h = document.createElement('h3')
    h.appendChild(document.createTextNode('Actions'))
    actions.appendChild(h)

    let ul = document.createElement('ul')
    form.appendChild(ul)

    let li = document.createElement('li')
    ul.appendChild(li)
    let a = document.createElement('a')
    a.innerHTML = '<i class="fas fa-eye"></i> Toggle visibility'
    a.href = '#'
    a.onclick = () => {
      this.toggleVisibility()
      return false
    }
    li.appendChild(a)
  }

  notifyModify () {
    if (this.leafletMarker) {
      this.leafletMarker.setLatLng(this.leafletLayer.getLatLng())
    }
  }

  disableEdit () {
    this.editor.sidebarDom.innerHTML = ''
    this.leafletLayer.editing.disable()
  }
}

module.exports = EditableFeature
