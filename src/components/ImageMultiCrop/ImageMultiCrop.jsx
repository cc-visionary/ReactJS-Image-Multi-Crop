import React from 'react'
import './ImageMultiCrop.css'

export default class ImageMultiCrop extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      imageHeight: null, // stores image height just in case it may change due to screen resolution (int)
      imageWidth: null, // stores image width just in case it may change due to screen resolution (int)
      imageX: null, // stores image location X to subtract it on cursor X in the image to get the true position of cursor in the image (int)
      imageY: null, // stores image location Y to subtract it on cursor Y in the image to get the true position of cursor in the image (int)
      urls: [], // stores the list of URLs of the images to be downloaded
      croppedNames: [], // stored the list of file names for the cropped images
      start_coords: [], // stores list of starting coordinates on click (2-dimensional array of int) [x, y]
      end_coords: [], // stores list of end coordinates on un-click (2-dimensional array of int) [x, y]
    }
  }

  componentDidMount() {
    const canvas = this.refs.canvas
    const ctx = canvas.getContext("2d")
    const img = this.refs.image

    img.onload = () => { // draw the image on the canvas
      this.setState({ imageHeight: img.height,
                      imageWidth: img.width })
      ctx.drawImage(img, 0, 0)
    }
  }

  mouse_over() {
    const canvasBound = this.refs.canvas.getBoundingClientRect() // allows us to get the image location x and y on the page
    this.setState({ imageX: canvasBound.x, imageY: canvasBound.y})
  }
s
  mouse_clicked(e) {
    const start_coordsX = e.clientX - this.state.imageX; // cursor_X - image_position_X to get real X position of cursor on image
    const start_coordsY = e.clientY - this.state.imageY; // cursor_Y - image_position_Y to get real Y position of cursor on image
    this.setState({start_coords: [...this.state.start_coords,[ start_coordsX , start_coordsY ]]})
  }

  mouse_unclicked(e) {
    const end_coordsX = e.clientX - this.state.imageX; // cursor_X - image_position_X to get real X position of cursor on image
    const end_coordsY = e.clientY - this.state.imageY; // cursor_Y - image_position_Y to get real Y position of cursor on image
    this.setState({end_coords: [...this.state.end_coords, [ end_coordsX , end_coordsY ]]})
    this.highlight(e.clientX - this.state.imageX, e.clientY - this.state.imageY) // triggers this.highlight function
  }

  highlight(end_x, end_y) { // informs the user of the area they wish to capture by highlighting the area with light yellow
    const ctx = this.refs.canvas.getContext("2d")
    let previous_index = this.state.start_coords.length - 1
    ctx.globalAlpha = 0.2; // opacity of highlight to 0.2
    ctx.fillStyle = 'yellow';
    // the ternary operator's functions is to detect if you dragged top left to bottom right or from bottom right to top left
    ctx.fillRect(this.state.start_coords[previous_index][0] < end_x ? this.state.start_coords[previous_index][0] : end_x, // x position 
                  this.state.start_coords[previous_index][1] < end_y ? this.state.start_coords[previous_index][1] : end_y, // y position
                 Math.abs(this.state.start_coords[this.state.start_coords.length - 1][0] - end_x), // width
                 Math.abs(this.state.start_coords[this.state.start_coords.length - 1][1] - end_y)) // height
    ctx.globalAlpha = 1; // opacity back to default of 1
  }

  delete_previous() { // to delete the most recent highlight
    const ctx = this.refs.canvas.getContext("2d")
    let previous_index = this.state.start_coords.length - 1
    // the ternary operator's functions is to detect if you dragged top left to bottom right or from bottom right to top left
    ctx.clearRect(this.state.start_coords[previous_index][0] < this.state.end_coords[previous_index][0] ? this.state.start_coords[previous_index][0] : this.state.end_coords[previous_index][0], // x position
                  this.state.start_coords[previous_index][1] < this.state.end_coords[previous_index][1] ? this.state.start_coords[previous_index][1] : this.state.end_coords[previous_index][1], // y position
                  Math.abs(this.state.start_coords[previous_index][0] - this.state.end_coords[previous_index][0]), // width
                  Math.abs(this.state.start_coords[previous_index][1] - this.state.end_coords[previous_index][1])) // height

    if (this.state.start_coords.length !== 1) {
      this.setState({ start_coords: this.state.start_coords.splice(0, previous_index), end_coords: this.state.end_coords.splice(0, previous_index) })
    } else {
      this.setState({ start_coords: [], end_coords: [] })
    }
  }

  crop() {
    for(let i = 0; i < this.state.start_coords.length; i++) {
      let canvas = document.getElementsByClassName("cropped-"+i)[0]
      let ctx = canvas.getContext("2d")
      let img = this.refs.image

      var left = this.state.start_coords[i][0] < this.state.end_coords[i][0] ? this.state.start_coords[i][0] : this.state.end_coords[i][0]
      var top =  this.state.start_coords[i][1] < this.state.end_coords[i][1] ? this.state.start_coords[i][1] : this.state.end_coords[i][1]
      var width = Math.abs(this.state.start_coords[i][0] - this.state.end_coords[i][0])
      var height = Math.abs(this.state.start_coords[i][1] - this.state.end_coords[i][1])

      canvas.width = width
      canvas.height = height
      
      ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
      console.log(canvas)
      this.setState({ urls: [...this.state.urls, canvas.toDataURL().replace("image/png", "image/octet-stream")], croppedNames: [...this.state.croppedNames, canvas.className] }) // put the links of the list of cropped images in an array of images
    }
  }

  download(e) {
    const ctx = this.refs.canvas.getContext("2d")
    ctx.clearRect(0, 0, this.state.imageWidth, this.state.imageHeight) // height
    this.setState({ start_coords: [], end_coords: [] })

  }

  list_images() {
    if (this.state.end_coords.length >= 1 && this.state.end_coords.length === this.state.start_coords.length) {
      return this.state.start_coords.map((i, index) => {
        return <div key={index} ><canvas className={"cropped-"+index} /></div>
      })
    }
  }

  display_crop_length() {
    return <span>{this.state.end_coords.length}    </span>
  }

  render() {
    return (
      <div className="crop-page" style={{ minHeight: '100%', textAlign: this.props.align ? this.props.align.toLowerCase() : "center"}}>
        { this.props.counter ? this.display_crop_length() : null }
        <button className="undo-button" onClick={ (e) => this.delete_previous(e) } disabled={this.state.end_coords.length < 1} >Undo</button>
        <button className="crop-button" onClick={ (e) => this.crop(e) } disabled={this.state.end_coords.length < 1} >Crop All</button>
        <button className="download-button" onClick={ (e) => this.download(e) } disabled={this.state.end_coords.length < 1} >Download</button>
        <div className="outer-div">
          <div>
            <canvas className="img-canvas"
                    ref="canvas"
                    width={this.state.imageWidth}
                    height={this.state.imageHeight} 
                    onMouseOver={ (e) => this.mouse_over(e) } 
                    onMouseDown ={ (e) => this.mouse_clicked(e) } 
                    onMouseUp ={ (e) => this.mouse_unclicked(e) } />
            <img ref="image" className="img" src={ this.props.src} alt={this.props.alt}/>
          </div>
          { this.props.checker ? <div className="crops"><p>Crops:</p>{ this.list_images() }</div> : null }
        </div>
      </div>
    )
  }
}

// Bugs:
// - can't put the all the urls in this.state.url
// - can't download and put it in zip file.